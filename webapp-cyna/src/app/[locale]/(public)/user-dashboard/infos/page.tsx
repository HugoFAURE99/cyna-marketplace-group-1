import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";

import { createServerClient } from "@/lib/supabase/server-client";

import { Link } from "@/i18n/navigation";
import { AccountToast } from "@/components/account/account-toast";

// Typage des données utilisateur (à remplacer plus tard par un fetch API/DB)
interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  creationDate: string;
}

export default async function Account({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ updated?: string }>;
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
  const { updated } = await searchParams;

  const [firstName, ...lastNameParts] = (dbUser?.nom_complet || "").split(" ");
  const lastName = lastNameParts.join(" ");

  const user: UserProfile = {
    firstName: firstName || "Utilisateur",
    lastName: lastName || "",
    email: dbUser?.adresse_mail || "",
    creationDate: authUser?.created_at
      ? new Date(authUser.created_at).toLocaleDateString()
      : "",
  };

  return (
    <div className="space-y-8">
      {updated === "password" && <AccountToast message={t("passwordUpdated")} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {t("title")}
        </h1>
        <Link
          href="/user-dashboard/user-edition"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 sm:w-auto"
        >
          {t("editProfile")}
        </Link>
      </div>

      <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-lg font-semibold capitalize text-slate-900">
          {user.firstName} {user.lastName}
        </h2>

        <dl className="mt-5 divide-y divide-slate-100 text-sm">
          <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
            <dt className="font-medium text-slate-500 sm:w-40 sm:shrink-0">
              {t("email")}
            </dt>
            <dd className="text-slate-900">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
            <dt className="font-medium text-slate-500 sm:w-40 sm:shrink-0">
              {t("creationDate")}
            </dt>
            <dd className="text-slate-900">{user.creationDate}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
