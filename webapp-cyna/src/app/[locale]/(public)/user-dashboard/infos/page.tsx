import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";

import { createServerClient } from "@/lib/supabase/server-client";

import { Link } from "@/i18n/navigation";
import { AccountToast } from "@/components/account/account-toast";
import { ShieldQuestion } from "lucide-react";
import { isActiveClient } from "@/lib/auth/roles";
import { OPEN_ADMIN_ACCESS_STATUSES } from "@/lib/support/admin-access";
import { MfaSettingsCard } from "@/components/account/MfaSettingsCard";

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
      .select("nom_complet, adresse_mail, role, is_actif")
      .eq("id_compte", authUser.id)
      .single();
    dbUser = data;
  }

  const t = await getTranslations("account");
  const tTickets = await getTranslations("tickets");
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
  const canRequestAdminAccess = isActiveClient(dbUser);
  const { data: factors } = authUser ? await supabase.auth.mfa.listFactors() : { data: null };
  const hasVerifiedTotp = factors?.totp.some((factor) => factor.status === "verified") ?? false;
  const { data: adminRequest } = canRequestAdminAccess && authUser
    ? await supabase
        .from("ticket_support")
        .select("id_support, status")
        .eq("id_compte", authUser.id)
        .eq("categorie", "admin_access")
        .in("status", [...OPEN_ADMIN_ACCESS_STATUSES])
        .order("date_creation", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {updated === "password" && <AccountToast message={t("passwordUpdated")} />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {t("title")}
        </h1>
        <Link
          href="/user-dashboard/user-edition"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 sm:w-auto"
        >
          {t("editProfile")}
        </Link>
      </div>

      <div className="w-full min-w-0 max-w-3xl rounded-lg border border-slate-200 bg-white p-5 sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">
          {user.firstName} {user.lastName}
        </h2>

        <dl className="mt-5 divide-y divide-slate-100 text-sm">
          <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
            <dt className="font-medium text-slate-500 sm:w-40 sm:shrink-0">
              {t("email")}
            </dt>
            <dd className="break-all text-slate-900">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-4">
            <dt className="font-medium text-slate-500 sm:w-40 sm:shrink-0">
              {t("creationDate")}
            </dt>
            <dd className="text-slate-900">{user.creationDate}</dd>
          </div>
        </dl>
      </div>

      {authUser && dbUser?.is_actif && (
        <MfaSettingsCard initialEnabled={hasVerifiedTotp} required={dbUser.role === "admin"} />
      )}

      {canRequestAdminAccess && (
        <section className="w-full min-w-0 max-w-3xl rounded-xl border border-purple-200 bg-purple-50/60 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-purple-700 shadow-sm ring-1 ring-purple-100">
              <ShieldQuestion aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950">{t("adminAccessTitle")}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {adminRequest ? t("adminAccessExisting") : t("adminAccessDescription")}
              </p>
              {adminRequest ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-purple-800 ring-1 ring-purple-200">
                    {tTickets(`statuses.${adminRequest.status}`)}
                  </span>
                  <Link className="text-sm font-semibold text-purple-800 underline underline-offset-4" href={`/user-dashboard/tickets/${adminRequest.id_support}`}>
                    {t("adminAccessView")}
                  </Link>
                </div>
              ) : (
                <Link className="mt-4 inline-flex min-h-11 items-center justify-center rounded-md bg-purple-700 px-4 text-sm font-semibold text-white transition hover:bg-purple-800" href={`/faq?category=admin_access&subject=${encodeURIComponent(t("adminAccessSubject"))}#contact`}>
                  {t("adminAccessRequest")}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
