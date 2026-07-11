import { getTranslations, setRequestLocale } from "next-intl/server";

import { OrdersList, type AccountOrder } from "@/components/account/orders-list";
import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

export default async function Orders({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("orders");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let orders: AccountOrder[] = [];
  if (user) {
    const { data, error } = await createAdminClient()
      .from("commande")
      .select("*, ligne_commande(prix_tarif(type_facturation))")
      .eq("id_compte", user.id)
      .order("date_commande", { ascending: false });
    if (error) console.error("[orders] query failed", error);
    orders = (data ?? []) as unknown as AccountOrder[];
  }
  return <div className="space-y-8"><h1 className="text-3xl font-bold tracking-tight text-slate-950">{t("title")}</h1><OrdersList orders={orders} locale={locale} /></div>;
}
