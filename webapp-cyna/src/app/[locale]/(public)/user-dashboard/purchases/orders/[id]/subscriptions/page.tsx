import { getTranslations, setRequestLocale } from "next-intl/server";
import { SubscriptionsList } from "@/components/account/subscriptions-list";
import type { AccountSubscription } from "@/components/account/subscription-card";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { BackButton } from "@/components/account/back-button";

export default async function OrderSubscriptions({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
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
    `).eq("id_commande", parseInt(id, 10)).order("date_debut", { ascending: false });
    if (error) throw new Error(`SUBSCRIPTION_LIST_QUERY_FAILED: ${error.message}`);
    subscriptions = (data ?? []) as unknown as AccountSubscription[];
  }
  return <div className="space-y-6">
    <div className="flex items-center gap-4">
      <BackButton />
      <h1 className="text-2xl font-bold text-slate-900">{t("orderSubscriptions", { id })}</h1>
    </div>
    <SubscriptionsList subscriptions={subscriptions} />
  </div>;
}
