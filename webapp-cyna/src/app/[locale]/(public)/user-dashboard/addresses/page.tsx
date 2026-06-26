import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";

export default async function Addresses({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("addresses");
  const supabase = await createServerClient();

  // Récupération de l'utilisateur connecté
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let addresses: any[] = [];

  if (authUser) {
    const { data } = await supabase
      .from("adresse")
      .select("*")
      .eq("id_compte", authUser.id)
      .eq("is_deleted", false)
      .order("id_adresse", { ascending: false });

    if (data) {
      addresses = data;
    }
  }

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-10 gap-4 sm:gap-20">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">{t("title")}</h1>
        <Link
          href="/user-dashboard/addresses/new"
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">{t("addNew")}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addresses.length > 0 ? (
          addresses.map((addr) => (
            <div
              key={addr.id_adresse}
              className="border border-gray-200 rounded-2xl p-6 shadow-sm bg-white flex flex-col hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-800">
                  {addr.prenom} {addr.nom}
                </h3>
                {addr.type_adresse && (
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md uppercase font-semibold">
                    {addr.type_adresse}
                  </span>
                )}
              </div>

              <div className="text-gray-600 mb-4 flex-1">
                <p>{addr.adresse}</p>
                {addr.adresse_complement && <p>{addr.adresse_complement}</p>}
                <p>
                  {addr.code_postal} {addr.ville}
                </p>
                <p>{addr.pays}</p>
              </div>

              {addr.telephone && (
                <div className="text-gray-500 text-sm mt-auto pt-4 border-t border-gray-100 flex items-center gap-2">
                  <span>📞</span>
                  <span>{addr.telephone}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">{t("noAddresses")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
