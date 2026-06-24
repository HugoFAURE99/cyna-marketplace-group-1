import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

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

  let email = authUser?.email;

  // Si l'email n'est pas dans authUser, on le cherche dans la table utilisateur
  if (authUser && !email) {
    const { data: dbUser } = await supabase
      .from("utilisateur")
      .select("adresse_mail")
      .eq("id_compte", authUser.id)
      .single();
    if (dbUser) {
      email = dbUser.adresse_mail;
    }
  }

  let invoices: any[] = [];
  
  if (email) {
    // Récupération des factures associées à l'utilisateur (commandes avec une url_facture)
    const { data } = await supabase
      .from("commande")
      .select("*")
      .eq("mail_utilisateur_invite", email)
      .not("url_facture", "is", null)
      .order("date_commande", { ascending: false });

    if (data) {
      invoices = data;
    }
  }

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans w-full">
      <h1 className="text-3xl font-bold text-black mb-10">{t("title")}</h1>

      <div className="w-full overflow-x-auto">
        {invoices.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="pb-4 font-bold text-gray-700">{t("id")}</th>
                <th className="pb-4 font-bold text-gray-700">{t("date")}</th>
                <th className="pb-4 font-bold text-gray-700">{t("amount")}</th>
                <th className="pb-4 font-bold text-gray-700">{t("status")}</th>
                <th className="pb-4 font-bold text-gray-700">Facture</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id_commande} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-gray-600">#{invoice.id_commande}</td>
                  <td className="py-4 text-gray-600">
                    {new Date(invoice.date_commande).toLocaleDateString(locale)}
                  </td>
                  <td className="py-4 text-gray-600 font-semibold">{invoice.montant_total} €</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      invoice.statut_commande === 'payée' || invoice.statut_commande === 'payee' || invoice.statut_commande === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {invoice.statut_commande}
                    </span>
                  </td>
                  <td className="py-4">
                    {invoice.url_facture ? (
                      <a
                        href={invoice.url_facture}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md shadow-sm hover:bg-gray-800 transition-colors text-sm font-medium"
                      >
                        {t("download")}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 text-center py-8">{t("noInvoices")}</p>
        )}
      </div>
    </div>
  );
}
