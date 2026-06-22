import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";

import { createServerClient } from "@/lib/supabase/server-client";

import { Button } from "@/components/ui/button";

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
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations("account");

  const user: UserProfile = {
    firstName: "Jean",
    lastName: "BERTRAND",
    email: "jean.bertrand@toutestpratique.fr",
    creationDate: "22/03/2022",
  };

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans">
      <h1 className="text-3xl font-bold text-black mb-10">{t("title")}</h1>
      <div className="bg-white rounded-[12px] border-[1.5px] p-10 max-w-3xl shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-extrabold uppercase m-0 tracking-wide">
            {user.lastName} <span className="capitalize">{user.firstName}</span>
          </h2>

          {/* Bouton d'édition shadcn */}
          <Button
            variant="outline"
            className="border-black rounded-xl text-sm hover:bg-gray-50 text-black px-6"
          >
            Edit User Profile
          </Button>
        </div>

        <div className="flex flex-col gap-4 text-lg">
          <p className="m-0">
            <span className="font-bold">Email : </span>
            {user.email}
          </p>
          <p className="m-0">
            <span className="font-bold">Creation account date : </span>
            {user.creationDate}
          </p>
        </div>
      </div>
    </div>
  );
}
