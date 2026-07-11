"use server";

import type Stripe from "stripe";

import { getCartView } from "@/lib/cart/cart";
import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";
import { stripe } from "@/lib/stripe";

type InventoryTariff = {
  id_prix: number;
  produit: { id_produit: number; quantite_produit: number } | null;
};

export async function processCheckout(locale: Locale) {
  const supabase = await createServerClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cart = await getCartView(locale);
  if (cart.items.length === 0) {
    throw new Error("EMPTY_CART");
  }

  const tariffIds = cart.items.map((item) => item.tariffId);
  const { data: inventoryRows, error: inventoryError } = await admin
    .from("prix_tarif")
    .select("id_prix, produit(id_produit, quantite_produit)")
    .in("id_prix", tariffIds);

  if (inventoryError || !inventoryRows) {
    throw new Error("INVENTORY_UNAVAILABLE");
  }

  const inventoryByTariff = new Map(
    (inventoryRows as unknown as InventoryTariff[]).map((row) => [
      row.id_prix,
      row.produit,
    ]),
  );
  const unavailableItem = cart.items.find((item) => {
    const product = inventoryByTariff.get(item.tariffId);
    return !product || product.quantite_produit < item.licenseUserCount;
  });
  if (unavailableItem) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  let stripeCustomerId: string | undefined;
  if (user) {
    const { data: profile } = await admin
      .from("utilisateur")
      .select("token_connexion_stripe")
      .eq("id_compte", user.id)
      .single();

    if (
      profile?.token_connexion_stripe &&
      profile.token_connexion_stripe !== "non_configure"
    ) {
      stripeCustomerId = profile.token_connexion_stripe;

      const { data: defaultAddress } = await admin
        .from("adresse")
        .select("prenom, nom, adresse, adresse_complement, ville, code_postal, region, pays, telephone")
        .eq("id_compte", user.id)
        .eq("is_deleted", false)
        .eq("is_default", true)
        .maybeSingle();

      if (defaultAddress) {
        await stripe.customers.update(stripeCustomerId, {
          name: `${defaultAddress.prenom} ${defaultAddress.nom}`.trim(),
          phone: defaultAddress.telephone ?? undefined,
          address: {
            line1: defaultAddress.adresse,
            line2: defaultAddress.adresse_complement ?? undefined,
            city: defaultAddress.ville,
            postal_code: defaultAddress.code_postal,
            state: defaultAddress.region ?? undefined,
            country:
              defaultAddress.pays.length === 2
                ? defaultAddress.pays.toUpperCase()
                : undefined,
          },
        });
      }
    }
  }

  const { data: order, error: orderError } = await admin
    .from("commande")
    .insert({
      id_compte: user?.id ?? null,
      mail_utilisateur_invite: user?.email ?? null,
      montant_total: cart.subtotalCents / 100,
      statut_commande: "En attente",
    })
    .select("id_commande")
    .single();

  if (orderError || !order) {
    throw new Error("ORDER_CREATE_FAILED");
  }

  const orderLines = cart.items.map((item) => ({
    id_commande: order.id_commande,
    id_prix: item.tariffId,
    quantite: item.licenseUserCount,
    prix_unitaire: item.unitPriceCents / 100,
    sous_total: item.lineTotalCents / 100,
  }));
  const { error: linesError } = await admin
    .from("ligne_commande")
    .insert(orderLines);

  if (linesError) {
    await admin
      .from("commande")
      .update({ statut_commande: "Échouée" })
      .eq("id_commande", order.id_commande);
    throw new Error("ORDER_LINES_FAILED");
  }

  const hasRecurringPrice = cart.items.some((item) =>
    ["mensuel", "annuel"].includes(item.typeFacturation.toLowerCase()),
  );
  const metadata: Record<string, string> = {
    id_commande: String(order.id_commande),
    id_compte: user?.id ?? "invite",
  };
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    allow_promotion_codes: true,
    billing_address_collection: "required",
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/cart`,
    client_reference_id: String(order.id_commande),
    line_items: cart.items.map((item) => ({
      price: item.stripePriceId,
      quantity: item.licenseUserCount,
    })),
    metadata,
    mode: hasRecurringPrice ? "subscription" : "payment",
    payment_method_types: ["card"],
    phone_number_collection: { enabled: true },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
  };

  if (hasRecurringPrice) {
    sessionConfig.subscription_data = { metadata };
  } else {
    sessionConfig.invoice_creation = {
      enabled: true,
      invoice_data: { metadata },
    };
  }
  if (stripeCustomerId) {
    sessionConfig.customer = stripeCustomerId;
    sessionConfig.customer_update = { address: "auto", name: "auto" };
  } else if (user?.email) {
    sessionConfig.customer_email = user.email;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionConfig);
    if (!session.url) {
      throw new Error("STRIPE_SESSION_WITHOUT_URL");
    }

    const { error: sessionLinkError } = await admin
      .from("commande")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id_commande", order.id_commande);
    if (sessionLinkError) {
      await stripe.checkout.sessions.expire(session.id);
      throw sessionLinkError;
    }

    return { url: session.url };
  } catch (error) {
    await admin
      .from("commande")
      .update({ statut_commande: "Échouée" })
      .eq("id_commande", order.id_commande);
    console.error("[checkout] Stripe session creation failed", error);
    throw new Error("CHECKOUT_FAILED");
  }
}
