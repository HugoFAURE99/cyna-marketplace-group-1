import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/server";
import { OrdersList } from "@/components/account/orders-list";

export const dynamic = "force-dynamic";

export default async function Orders({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("orders");
  const supabase = await createServerClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let email = authUser?.email || "";
  if (authUser) {
    const { data: dbUser } = await supabase
      .from("utilisateur")
      .select("adresse_mail")
      .eq("id_compte", authUser.id)
      .single();
    if (dbUser && dbUser.adresse_mail) {
      email = dbUser.adresse_mail;
    }
  }

  // Récupération des commandes associées à l'email de l'utilisateur
  let orders: any[] = [];
  if (email) {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("commande")
      .select(`
        *,
        ligne_commande (
          prix_tarif (
            type_facturation
          )
        )
      `)
      .ilike("mail_utilisateur_invite", email)
      .order("date_commande", { ascending: false });

    if (error) {
      console.error("Supabase Error Orders:", error);
      orders = [{ id_commande: 9999, date_commande: new Date().toISOString(), montant_total: 0, statut_commande: "ERROR: " + error.message }];
    } else if (data) {
      orders = data;
    }
  }

  return (
    <div className="flex flex-col sm:p-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-6 sm:mb-10">{t("title")}</h1>

      <OrdersList orders={orders} locale={locale} />

      {/* Message d'avertissement pour les factures */}
      <div className="w-full flex justify-end mt-4 px-4 sm:px-0">
        <p className="text-red-500 text-sm font-medium max-w-sm text-right">
          {t("invoiceWarning")}
        </p>
      </div>
    </div>
  );
}
