import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { isActiveAdmin } from "@/lib/auth/roles";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Keep the locale redirect/rewrite response: Supabase cookies and refresh
  // headers must be added to this same object or the rewrite can be lost.
  const response = handleI18nRouting(request);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headersToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headersToSet).forEach(([key, value]) =>
            response.headers.set(key, value),
          );
        },
      },
    },
  );

  // Refresh an expired session when needed. Authentication redirects stay in
  // layouts so their destination always includes the active locale.
  const {
    data: { user },
  } = await supabase.auth.getUser(); // On récupère l'utilisateur ici

  // ==========================================
  // VÉRIFICATION 2FA ET RÔLE POUR LES ADMINS
  // ==========================================
  const pathname = request.nextUrl.pathname;
  const locale = pathname.startsWith("/en") ? "en" : "fr";
  const isAuthRoute =
    /^\/(?:fr|en)\/(?:login|register|reset-password|mfa-verify)(?:\/|$)/.test(
      pathname,
    );
  const { data: profile } = user
    ? await supabase
        .from("utilisateur")
        .select("role, is_actif")
        .eq("id_compte", user.id)
        .maybeSingle()
    : { data: null };

  if (user && !profile?.is_actif) {
    await supabase.auth.signOut({ scope: "local" });
    if (!isAuthRoute) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      loginUrl.search = "?error=errorInactive";
      return NextResponse.redirect(loginUrl);
    }
    return response;
  }

  const { data: assurance } = user
    ? await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    : { data: null };

  if (
    user &&
    !isAuthRoute &&
    assurance?.currentLevel !== "aal2" &&
    assurance?.nextLevel === "aal2"
  ) {
    const mfaUrl = request.nextUrl.clone();
    mfaUrl.pathname = `/${locale}/mfa-verify`;
    mfaUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(mfaUrl);
  }

  // Cette regex détecte les routes comme /admin, /fr/admin, /en/admin
  const isAdminRoute = /^\/(?:fr|en)\/admin(?:\/|$)/.test(pathname);

  if (isAdminRoute) {
    // 1. Bloquer les utilisateurs non connectés
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = `/${locale}/login`;
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    // 2. Vérifier si l'utilisateur possède bien le rôle "Admin"
    if (!isActiveAdmin(profile)) {
      // S'il est enregistré comme "client", on le renvoie vers son tableau de bord
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = `/${locale}/user-dashboard`;
      return NextResponse.redirect(homeUrl);
    }

    // 3. Vérifier le niveau d'authentification (aal2 = mot de passe + 2FA)
    if (assurance?.currentLevel !== "aal2") {
      // S'il n'a pas validé sa 2FA, on le redirige vers la page de vérification
      const mfaUrl = request.nextUrl.clone();
      mfaUrl.pathname = `/${locale}/mfa-verify`;
      mfaUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(mfaUrl);
    }
  }

  // On retourne la réponse de base
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
