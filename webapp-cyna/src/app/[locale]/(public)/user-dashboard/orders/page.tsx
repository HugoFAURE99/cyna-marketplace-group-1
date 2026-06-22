import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

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

  // Récupération des commandes associées à l'email
  let orders: any[] = [];
  if (email) {
    const { data } = await supabase
      .from("commande")
      .select("*")
      .eq("mail_utilisateur_invite", email)
      .order("date_commande", { ascending: false });

    if (data) {
      orders = data;
    }
  }

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans">
      <h1 className="text-3xl font-bold text-black mb-10">{t("title")}</h1>

      <div className="p-10 overflow-x-auto">
        {orders.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="pb-4 font-bold text-gray-700">ID Commande</th>
                <th className="pb-4 font-bold text-gray-700">Date</th>
                <th className="pb-4 font-bold text-gray-700">Montant</th>
                <th className="pb-4 font-bold text-gray-700">Statut</th>
                <th className="pb-4 font-bold text-gray-700">Facture</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id_commande} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 text-gray-600">#{order.id_commande}</td>
                  <td className="py-4 text-gray-600">
                    {new Date(order.date_commande).toLocaleDateString(locale)}
                  </td>
                  <td className="py-4 text-gray-600 font-semibold">{order.montant_total} €</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${order.statut_commande === 'payée' || order.statut_commande === 'payee' || order.statut_commande === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                      }`}>
                      {order.statut_commande}
                    </span>
                  </td>
                  <td className="py-4">
                    {order.url_facture ? (
                      <a
                        href={order.url_facture}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-medium"
                      >
                        Voir la facture
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
          <p className="text-gray-500 text-center py-8">Aucune commande trouvée.</p>
        )}
      </div>
    </div>
  );
}
