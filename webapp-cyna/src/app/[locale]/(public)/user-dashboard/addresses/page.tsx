import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { Link } from "@/i18n/navigation";
import { Plus } from "lucide-react";
import { AddressesList } from "@/components/account/addresses-list";

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

      <AddressesList addresses={addresses} />
    </div>
  );
}
