import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { SubscriptionCard } from "@/components/account/subscription-card";

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
    <div className="flex flex-col bg-white text-gray-900 font-sans w-full">
      <h1 className="text-3xl font-bold text-black mb-10">{t("title")}</h1>

      <div className="w-full">
        {subscriptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {subscriptions.map((subscription) => (
              <SubscriptionCard key={subscription.id_abonnement} subscription={subscription} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 py-8">{t("noSubscriptions")}</p>
        )}
      </div>
    </div>
  );
}
