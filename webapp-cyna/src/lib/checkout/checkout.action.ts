"use server";

import type Stripe from "stripe";

import { getCartView, type CartViewItem } from "@/lib/cart/cart";
import { getCheckoutPromotionOptions } from "@/lib/checkout/checkout-session";
import {
  MAX_LICENSE_USERS,
  MIN_LICENSE_USERS,
} from "@/lib/cart/cart-constants";
import type { Locale } from "@/lib/i18n/translations";
import { getCatalogProductsByIds } from "@/lib/products/public-catalog";
import { calculatePromotionalPriceCents } from "@/lib/promotions/automatic-promotion";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";
import { stripe } from "@/lib/stripe";

type CheckoutInput = {
  cancelPath: string;
  items: CartViewItem[];
  locale: Locale;
  subtotalCents: number;
};

export type BuyNowInput = {
  licenseUserCount: number;
  locale: Locale;
  productId: number;
  tariffId: number;
};

function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) throw new Error("SITE_URL_NOT_CONFIGURED");
  return siteUrl.replace(/\/$/, "");
}

async function createCheckout({
  cancelPath,
  items,
  locale,
  subtotalCents,
}: CheckoutInput) {
  if (items.length === 0) throw new Error("EMPTY_CART");
  if (items.some((item) => item.isUnavailable)) {
    throw new Error("PRODUCT_UNAVAILABLE");
  }
  const siteUrl = getSiteUrl();
  const promotions = new Map(
    items.flatMap((item) =>
      item.automaticPromotion?.stripeCouponId
        ? [[item.automaticPromotion.id, item.automaticPromotion] as const]
        : [],
    ),
  );
  if (promotions.size > 1) throw new Error("AUTOMATIC_PROMOTION_CONFLICT");
  const automaticPromotion = [...promotions.values()][0] ?? null;

  const supabase = await createServerClient();
  const admin = createAdminClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
        .select(
          "prenom, nom, adresse, adresse_complement, ville, code_postal, region, pays, telephone",
        )
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
      montant_total: subtotalCents / 100,
      id_promotion: automaticPromotion?.id ?? null,
      statut_commande: "En attente",
    })
    .select("id_commande")
    .single();

  if (orderError || !order) throw new Error("ORDER_CREATE_FAILED");

  const orderLines = items.map((item) => ({
    id_commande: order.id_commande,
    id_prix: item.tariffId,
    id_promotion:
      item.automaticPromotion?.id === automaticPromotion?.id
        ? automaticPromotion.id
        : null,
    quantite: item.licenseUserCount,
    prix_unitaire: item.originalUnitPriceCents / 100,
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

  const hasRecurringPrice = items.some((item) =>
    ["mensuel", "annuel"].includes(item.typeFacturation.toLowerCase()),
  );
  const metadata: Record<string, string> = {
    id_commande: String(order.id_commande),
    id_compte: user?.id ?? "invite",
  };
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    ...getCheckoutPromotionOptions(automaticPromotion),
    billing_address_collection: "required",
    cancel_url: `${siteUrl}${cancelPath}`,
    client_reference_id: String(order.id_commande),
    line_items: items.map((item) => ({
      price: item.stripePriceId,
      quantity: item.licenseUserCount,
    })),
    metadata,
    mode: hasRecurringPrice ? "subscription" : "payment",
    payment_method_types: ["card"],
    phone_number_collection: { enabled: true },
    success_url: `${siteUrl}/${locale}/order-confirmed?session_id={CHECKOUT_SESSION_ID}`,
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
    if (!session.url) throw new Error("STRIPE_SESSION_WITHOUT_URL");

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

export async function processCheckout(locale: Locale) {
  const cart = await getCartView(locale);
  return createCheckout({
    cancelPath: `/${locale}/cart`,
    items: cart.items,
    locale,
    subtotalCents: cart.subtotalCents,
  });
}

export async function processBuyNow(input: BuyNowInput) {
  const { licenseUserCount, locale, productId, tariffId } = input;
  if (
    !Number.isInteger(productId) ||
    productId <= 0 ||
    !Number.isInteger(tariffId) ||
    tariffId <= 0 ||
    !Number.isInteger(licenseUserCount) ||
    licenseUserCount < MIN_LICENSE_USERS ||
    licenseUserCount > MAX_LICENSE_USERS
  ) {
    throw new Error("INVALID_BUY_NOW_SELECTION");
  }

  const [product] = await getCatalogProductsByIds([productId], locale);
  if (!product || !product.est_disponible) {
    throw new Error("PRODUCT_UNAVAILABLE");
  }
  const tariff = product.tariffs.find((entry) => entry.id_prix === tariffId);
  if (!tariff || !tariff.stripe_price_id) {
    throw new Error("INVALID_TARIFF");
  }

  const item: CartViewItem = {
    automaticPromotion: tariff.automaticPromotion,
    productId,
    tariffId,
    licenseUserCount,
    name: product.nom_pro,
    imageUrl:
      product.images[0]?.lien_image_produit ??
      product.category?.lien_image_cat ??
      null,
    categoryName: product.category?.cat_nom ?? null,
    tariffs: product.tariffs,
    typeFacturation: tariff.type_facturation,
    unitPriceCents: tariff.promotionalPriceCents,
    originalUnitPriceCents: tariff.prix,
    originalLineTotalCents: tariff.prix * licenseUserCount,
    lineTotalCents: calculatePromotionalPriceCents(
      tariff.prix * licenseUserCount,
      tariff.automaticPromotion,
    ),
    isUnavailable: false,
    stripePriceId: tariff.stripe_price_id,
  };
  const cancelQuery = new URLSearchParams({
    tariff: String(tariffId),
    seats: String(licenseUserCount),
  });

  return createCheckout({
    cancelPath: `/${locale}/products/${productId}?${cancelQuery}`,
    items: [item],
    locale,
    subtotalCents: item.lineTotalCents,
  });
}
