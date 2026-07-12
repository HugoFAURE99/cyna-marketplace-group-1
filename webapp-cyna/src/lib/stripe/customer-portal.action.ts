"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { createServerClient } from "@/lib/supabase/server-client";
import { stripe } from "@/lib/stripe";

export async function openCustomerPortal() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${await safeLocale()}/login`);

  const { data: profile } = await supabase
    .from("utilisateur")
    .select("token_connexion_stripe")
    .eq("id_compte", user.id)
    .single();
  const customerId = profile?.token_connexion_stripe;
  if (!customerId || customerId === "non_configure") {
    redirect(`/${await safeLocale()}/user-dashboard/purchases/subscriptions?portal=unavailable`);
  }

  const locale = await safeLocale();
  const configuration = await getPortalConfiguration();
  const session = await stripe.billingPortal.sessions.create({
    configuration,
    customer: customerId,
    locale,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/user-dashboard/purchases/subscriptions`,
  });
  redirect(session.url);
}

async function getPortalConfiguration() {
  if (process.env.STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID) {
    return process.env.STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID;
  }
  const configurations = await stripe.billingPortal.configurations.list({
    active: true,
    limit: 100,
  });
  const existing = configurations.data.find(
    (item) =>
      item.features.payment_method_update.enabled &&
      item.features.subscription_cancel.enabled &&
      item.features.subscription_cancel.mode === "at_period_end",
  );
  if (existing) return existing.id;

  const created = await stripe.billingPortal.configurations.create({
    business_profile: { headline: "CYNA customer portal" },
    features: {
      customer_update: {
        allowed_updates: ["address", "name", "phone"],
        enabled: true,
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        cancellation_reason: {
          enabled: true,
          options: ["too_expensive", "missing_features", "switched_service", "other"],
        },
        enabled: true,
        mode: "at_period_end",
      },
      subscription_update: { enabled: false },
    },
  });
  return created.id;
}

async function safeLocale() {
  return (await getLocale()) === "en" ? "en" : "fr";
}
