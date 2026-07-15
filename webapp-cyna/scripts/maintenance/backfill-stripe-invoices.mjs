// MANUAL MAINTENANCE ONLY: recovery for invoices created before the webhook.
// Run deliberately with: npm run invoices:backfill
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const required = [
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

let startingAfter;
let recovered = 0;
do {
  const page = await stripe.invoices.list({ limit: 100, starting_after: startingAfter });
  for (const invoice of page.data) {
    const details = invoice.parent?.subscription_details;
    const subscriptionId =
      typeof details?.subscription === "string"
        ? details.subscription
        : details?.subscription?.id ?? null;
    let metadata = details?.metadata ?? invoice.metadata ?? {};
    if (subscriptionId && (!metadata.id_commande || !metadata.id_compte)) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      metadata = { ...subscription.metadata, ...metadata };
    }

    const orderId = Number(metadata.id_commande) || null;
    const accountId = metadata.id_compte && metadata.id_compte !== "invite"
      ? metadata.id_compte
      : null;
    let storagePath = null;
    if (invoice.invoice_pdf) {
      const response = await fetch(invoice.invoice_pdf);
      if (!response.ok) throw new Error(`Download failed for ${invoice.id}`);
      storagePath = `${accountId ?? "invite"}/${orderId ?? "renewals"}/${invoice.id}.pdf`;
      const { error } = await supabase.storage
        .from("invoice-pdf")
        .upload(storagePath, Buffer.from(await response.arrayBuffer()), {
          contentType: "application/pdf",
          upsert: true,
        });
      if (error) throw error;
    }

    const { error } = await supabase.from("facture").upsert({
      stripe_invoice_id: invoice.id,
      id_commande: orderId,
      id_compte: accountId,
      stripe_subscription_id: subscriptionId,
      email_client: invoice.customer_email,
      date_facture: new Date(invoice.created * 1000).toISOString(),
      montant_total: invoice.total / 100,
      devise: invoice.currency,
      statut: invoice.status ?? "draft",
      storage_path: storagePath,
      hosted_invoice_url: invoice.hosted_invoice_url,
      updated_at: new Date().toISOString(),
    }, { onConflict: "stripe_invoice_id" });
    if (error) throw error;
    recovered += 1;
  }
  startingAfter = page.has_more ? page.data.at(-1)?.id : undefined;
} while (startingAfter);

console.log(`Recovered ${recovered} Stripe invoices.`);
