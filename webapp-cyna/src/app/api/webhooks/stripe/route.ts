import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

import { captureOperationalException } from "@/lib/observability/capture";
import { stripe } from "@/lib/stripe";
import { syncStripeSubscription } from "@/lib/stripe/subscription-sync";
import type { Database, TablesInsert } from "@/types/database.types";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !endpointSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      endpointSecret,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    console.error("[stripe-webhook] signature validation failed", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCompletedCheckout(event.data.object);
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncStripeSubscription(event.data.object);
    } else if (
      event.type === "subscription_schedule.updated" ||
      event.type === "subscription_schedule.released" ||
      event.type === "subscription_schedule.completed" ||
      event.type === "subscription_schedule.canceled" ||
      event.type === "subscription_schedule.aborted"
    ) {
      await syncScheduleSubscription(event.data.object);
    } else if (
      event.type === "invoice.finalized" ||
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.voided"
    ) {
      await upsertInvoice(event.data.object);
    }
  } catch (error) {
    console.error(`[stripe-webhook] ${event.type} failed`, error);
    captureOperationalException(error, {
      area: "stripe-webhook",
      stage: "process-event",
      tags: { "stripe.event_type": event.type },
    });
    // A non-2xx response asks Stripe to retry. Every write below is idempotent.
    return NextResponse.json({ received: false }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCompletedCheckout(session: Stripe.Checkout.Session) {
  const orderId = Number(session.metadata?.id_commande);
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error("Checkout session has no valid order id");
  }

  const accountId = normaliseAccountId(session.metadata?.id_compte);
  const customerEmail =
    session.customer_details?.email ?? session.customer_email ?? null;
  const customerId = stripeId(session.customer);
  const paymentMethod = await getPaymentMethodSummary(session);
  const address = session.customer_details?.address;

  const { error: orderError } = await supabase
    .from("commande")
    .update({
      id_compte: accountId,
      mail_utilisateur_invite: customerEmail,
      montant_total:
        session.amount_total === null
          ? undefined
          : session.amount_total / 100,
      billing_address_snapshot: address
        ? {
            city: address.city,
            country: address.country,
            line1: address.line1,
            line2: address.line2,
            name: session.customer_details?.name ?? null,
            postal_code: address.postal_code,
            state: address.state,
          }
        : null,
      payment_method_brand: paymentMethod?.brand ?? null,
      payment_method_last4: paymentMethod?.last4 ?? null,
      stripe_checkout_session_id: session.id,
    })
    .eq("id_commande", orderId);
  if (orderError) throw orderError;

  const { error: finaliseError } = await supabase.rpc("finalize_paid_order", {
    p_order_id: orderId,
  });
  if (finaliseError) throw finaliseError;

  if (accountId && customerId) {
    const { error } = await supabase
      .from("utilisateur")
      .update({ token_connexion_stripe: customerId })
      .eq("id_compte", accountId);
    if (error) throw error;
  }

  await syncBillingAddress(session, accountId, customerEmail);

  const subscriptionId = stripeId(session.subscription);
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await syncStripeSubscription(subscription, { accountId, orderId });
  }
}

async function syncScheduleSubscription(schedule: Stripe.SubscriptionSchedule) {
  const subscriptionId =
    stripeId(schedule.subscription) ?? schedule.released_subscription;
  if (!subscriptionId) return;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncStripeSubscription(subscription);
}

async function getPaymentMethodSummary(session: Stripe.Checkout.Session) {
  let paymentMethodId: string | null = null;
  const paymentIntentId = stripeId(session.payment_intent);
  if (paymentIntentId) {
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    paymentMethodId = stripeId(intent.payment_method);
  } else {
    const subscriptionId = stripeId(session.subscription);
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      paymentMethodId = stripeId(subscription.default_payment_method);
    }
  }
  if (!paymentMethodId) return null;
  const method = await stripe.paymentMethods.retrieve(paymentMethodId);
  return method.card
    ? { brand: method.card.brand, last4: method.card.last4 }
    : null;
}

async function syncBillingAddress(
  session: Stripe.Checkout.Session,
  accountId: string | null,
  customerEmail: string | null,
) {
  const address = session.customer_details?.address;
  if (!address?.line1 || !address.city || !address.postal_code || !address.country) {
    return;
  }

  const nameParts = (session.customer_details?.name ?? "").trim().split(/\s+/);
  const firstName = nameParts.shift() || "Client";
  const lastName = nameParts.join(" ") || "CYNA";
  const baseAddress = {
    adresse: address.line1,
    adresse_complement: address.line2,
    code_postal: address.postal_code,
    mail_utilisateur_invite: accountId ? null : customerEmail,
    nom: lastName,
    pays: address.country,
    prenom: firstName,
    region: address.state,
    telephone: session.customer_details?.phone,
    type_adresse: "Facturation",
    ville: address.city,
  };

  if (!accountId) {
    const { error } = await supabase.from("adresse").insert(baseAddress);
    if (error) throw error;
    return;
  }

  const { error: clearDefaultError } = await supabase
    .from("adresse")
    .update({ is_default: false })
    .eq("id_compte", accountId)
    .eq("is_default", true);
  if (clearDefaultError) throw clearDefaultError;

  const { data: existing, error: findError } = await supabase
    .from("adresse")
    .select("id_adresse")
    .eq("id_compte", accountId)
    .eq("is_deleted", false)
    .eq("adresse", address.line1)
    .eq("code_postal", address.postal_code)
    .eq("ville", address.city)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("adresse")
      .update({ ...baseAddress, is_default: true })
      .eq("id_adresse", existing.id_adresse);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("adresse")
      .insert({ ...baseAddress, id_compte: accountId, is_default: true });
    if (error) throw error;
  }
}

async function upsertInvoice(invoice: Stripe.Invoice) {
  const context = await resolveInvoiceContext(invoice);
  const { data: existing, error: existingError } = await supabase
    .from("facture")
    .select("storage_path")
    .eq("stripe_invoice_id", invoice.id)
    .maybeSingle();
  if (existingError) throw existingError;

  let storagePath = existing?.storage_path ?? null;
  if (invoice.invoice_pdf && !storagePath) {
    const response = await fetch(invoice.invoice_pdf);
    if (!response.ok) {
      throw new Error(`Could not download Stripe invoice ${invoice.id}`);
    }
    const ownerFolder = context.accountId ?? "invite";
    const orderFolder = context.orderId ? String(context.orderId) : "renewals";
    storagePath = `${ownerFolder}/${orderFolder}/${invoice.id}.pdf`;
    const { error: storageError } = await supabase.storage
      .from("invoice-pdf")
      .upload(storagePath, Buffer.from(await response.arrayBuffer()), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (storageError) throw storageError;
  }

  const payload: TablesInsert<"facture"> = {
    date_facture: new Date(invoice.created * 1000).toISOString(),
    devise: invoice.currency,
    email_client: invoice.customer_email ?? context.email,
    hosted_invoice_url: invoice.hosted_invoice_url,
    id_commande: context.orderId,
    id_compte: context.accountId,
    montant_total: invoice.total / 100,
    statut: invoice.status ?? "draft",
    storage_path: storagePath,
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: context.subscriptionId,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase
    .from("facture")
    .upsert(payload, { onConflict: "stripe_invoice_id" });
  if (error) throw error;

  // Temporary compatibility for screens or old code still reading commande.
  if (context.orderId && storagePath) {
    const { error: legacyError } = await supabase
      .from("commande")
      .update({ url_facture: storagePath.split("/").at(-1) ?? null })
      .eq("id_commande", context.orderId);
    if (legacyError) throw legacyError;
  }
}

async function resolveInvoiceContext(invoice: Stripe.Invoice) {
  const parent = invoice.parent?.subscription_details;
  const subscriptionId = stripeId(parent?.subscription);
  let metadata = parent?.metadata ?? invoice.metadata ?? {};

  if (subscriptionId && (!metadata.id_commande || !metadata.id_compte)) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    metadata = { ...subscription.metadata, ...metadata };
  }

  let orderId = positiveInteger(metadata.id_commande);
  let accountId = normaliseAccountId(metadata.id_compte);
  if (subscriptionId && (!orderId || !accountId)) {
    const { data, error } = await supabase
      .from("abonnement")
      .select("id_commande, id_compte")
      .eq("stripe_subscription_id", subscriptionId)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    orderId ??= data?.id_commande ?? null;
    accountId ??= data?.id_compte ?? null;
  }

  if (orderId && !accountId) {
    const { data, error } = await supabase
      .from("commande")
      .select("id_compte, mail_utilisateur_invite")
      .eq("id_commande", orderId)
      .maybeSingle();
    if (error) throw error;
    accountId = data?.id_compte ?? null;
    return {
      accountId,
      email: data?.mail_utilisateur_invite ?? invoice.customer_email,
      orderId,
      subscriptionId,
    };
  }

  return {
    accountId,
    email: invoice.customer_email,
    orderId,
    subscriptionId,
  };
}

function stripeId(value: string | { id: string } | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function positiveInteger(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normaliseAccountId(value: string | undefined) {
  return value && value !== "invite" ? value : null;
}
