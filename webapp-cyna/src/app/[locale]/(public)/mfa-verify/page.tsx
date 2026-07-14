import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { MfaPanel } from "@/components/auth/MfaPanel";
import { SiteTransitionReady } from "@/components/layout/SiteTransitionProvider";
import { isAdminDestination, sanitizeMfaNext } from "@/lib/auth/mfa-return";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import { isActiveAdmin, isActiveUser } from "@/lib/auth/roles";

export default async function MfaVerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const next = sanitizeMfaNext(query.next, locale);
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from("utilisateur")
    .select("role, is_actif")
    .eq("id_compte", user.id)
    .maybeSingle();

  if (!isActiveUser(profile)) redirect(`/${locale}/login?error=errorInactive`);
  const adminDestination = isAdminDestination(next, locale);
  if (adminDestination && !isActiveAdmin(profile)) redirect(`/${locale}/user-dashboard`);

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === "aal2") redirect(next);
  if (assurance?.nextLevel !== "aal2" && !adminDestination) redirect(next);

  return (
    <>
      <SiteTransitionReady destination="admin" />
      <MfaPanel mode={assurance?.nextLevel === "aal2" ? "challenge" : "required-admin-enrollment"} next={next} />
    </>
  );
}
