import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { SubscriptionsList } from "@/components/account/subscriptions-list";

export default async function Subscriptions({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("subscriptions");
  const supabase = await createServerClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let subscriptions: any[] = [];

  if (authUser) {
    const { data } = await supabase
      .from("abonnement")
      .select(`
        *,
        prix_tarif (
          prix_tarif_traduction (
            nom_prix_tarif,
            langue
          ),
          produit (
            produit_traduction (
              nom_pro,
              langue
            )
          )
        )
      `)
      .eq("id_compte", authUser.id)
      .order("date_debut", { ascending: false });

    if (data) {
      subscriptions = data;
    }
  }

  return (
    <div className="flex flex-col w-full sm:p-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-6 sm:mb-10">{t("title")}</h1>

      <SubscriptionsList subscriptions={subscriptions} />
    </div>
  );
}
