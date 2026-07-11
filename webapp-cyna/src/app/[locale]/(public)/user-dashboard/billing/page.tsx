import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { createAdminClient } from "@/lib/supabase/server";
import { BillingList } from "@/components/account/billing-list";
export default async function Billing({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const t = await getTranslations("billing");
  const supabase = await createServerClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let email = "";
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

  let invoices: any[] = [];
  
  if (email) {
    // Récupération des factures associées à l'utilisateur (commandes avec une url_facture)
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from("commande")
      .select("*")
      .ilike("mail_utilisateur_invite", email)
      .not("url_facture", "is", null)
      .order("date_commande", { ascending: false });

    if (data) {
      invoices = data;
    }
  }

  return (
    <div className="flex flex-col w-full sm:p-4">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 mb-6 sm:mb-10">{t("title")}</h1>

      <BillingList invoices={invoices} locale={locale} />
      
      {/* Message d'avertissement pour les factures */}
      <div className="w-full flex justify-end mt-4 px-4 sm:px-0">
        <p className="text-red-500 text-sm font-medium max-w-sm text-right">
          {t("invoiceWarning")}
        </p>
      </div>
    </div>
  );
}
