import { CreditCard } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SubscriptionsList } from "@/components/account/subscriptions-list";
import type { AccountSubscription } from "@/components/account/subscription-card";
import type { Locale } from "@/lib/i18n/translations";
import { openCustomerPortal } from "@/lib/stripe/customer-portal.action";
import { createServerClient } from "@/lib/supabase/server-client";

export default async function PurchaseSubscriptions({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ portal?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("subscriptions");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let subscriptions: AccountSubscription[] = [];
  if (user) {
    const { data, error } = await supabase.from("abonnement").select(`
      *,
      commande (date_commande, montant_total, statut_commande),
      prix_tarif (
        prix_tarif_traduction (nom_prix_tarif, langue),
        produit (produit_traduction (nom_pro, langue))
      )
    `).order("date_debut", { ascending: false });
    if (error) throw new Error(`SUBSCRIPTION_LIST_QUERY_FAILED: ${error.message}`);
    subscriptions = (data ?? []) as unknown as AccountSubscription[];
  }
  const { portal } = await searchParams;
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 rounded-lg border border-purple-100 bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold text-slate-950">{t("manageTitle")}</h2><p className="mt-1 text-sm text-slate-600">{t("manageDescription")}</p></div>
      <form action={openCustomerPortal}><button className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-purple-700 px-4 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-900 sm:w-auto" type="submit"><CreditCard aria-hidden="true" className="size-4" />{t("manage")}</button></form>
    </div>
    {portal === "unavailable" && <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="alert">{t("portalUnavailable")}</p>}
    <SubscriptionsList subscriptions={subscriptions} />
  </div>;
}
