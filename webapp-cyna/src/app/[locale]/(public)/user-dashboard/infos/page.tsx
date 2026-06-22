import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";

import { createServerClient } from "@/lib/supabase/server-client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

// Typage des données utilisateur (à remplacer plus tard par un fetch API/DB)
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  creationDate: string;
}

export default async function Account({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let dbUser = null;
  if (authUser) {
    const { data } = await supabase
      .from("utilisateur")
      .select("nom_complet, adresse_mail")
      .eq("id_compte", authUser.id)
      .single();
    dbUser = data;
  }

  const t = await getTranslations("account");

  const [firstName, ...lastNameParts] = (dbUser?.nom_complet || "").split(" ");
  const lastName = lastNameParts.join(" ");

  const user: UserProfile = {
    firstName: firstName || "Utilisateur",
    lastName: lastName || "",
    email: dbUser?.adresse_mail || authUser?.email || "",
    creationDate: authUser?.created_at
      ? new Date(authUser.created_at).toLocaleDateString()
      : "",
  };

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans p-6 lg:p-10">
      <div className="flex items-center justify-between mb-10 gap-20">
        <h1 className="text-3xl font-bold text-black">{t("title")}</h1>
        <Link
          href="/user-dashboard/user-edition"
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <span className="font-medium">{t("editProfile")}</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-8 max-w-3xl shadow-sm">
        <div className="mb-8">
          <h2 className="text-2xl font-bold uppercase m-0 tracking-wide text-gray-800">
            {user.lastName} <span className="capitalize">{user.firstName}</span>
          </h2>
        </div>

        <div className="flex flex-col gap-4 text-lg">
          <p className="m-0 text-gray-600">
            <span className="font-semibold text-gray-900">Email : </span>
            {user.email}
          </p>
          <p className="m-0 text-gray-600">
            <span className="font-semibold text-gray-900">Creation account date : </span>
            {user.creationDate}
          </p>
        </div>
      </div>
    </div>
  );
}
