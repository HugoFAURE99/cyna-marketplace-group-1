import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";

import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);


export async function proxy(request: NextRequest) {
  // Run next-intl first so locale redirects/rewrites are preserved.
  const response = handleI18nRouting(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          // Keep refreshed auth cookies available to the current request.
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          // Forward refreshed auth cookies and cache headers to the browser.
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  // 3. Utilisation de regex pour ne pas bloquer sur le /fr ou /en de next-intl
  const isProtectedRoute = /^\/(fr|en)\/admin/.test(url.pathname);
  const isAuthRoute = /^\/(fr|en)\/(login|register)/.test(url.pathname);
  /*
    // Redirect anonymous users away from protected sections.
    if (!user && isProtectedRoute) {
      const locale = url.pathname.split('/')[1] || 'fr'; // Récupère la langue en cours
      
      //On sauvegarde la page où l'utilisateur voulait aller
      const nextPath = url.pathname;
      
      url.pathname = `/${locale}/login`;
      url.searchParams.set('next', nextPath); // Ajoute le paramètre ?next=/fr/admin...
      
      return NextResponse.redirect(url);
    }
  
    // Redirect signed-in users away from login and registration screens.
    if (user && isAuthRoute) {
      const locale = url.pathname.split('/')[1] || 'fr';
      url.pathname = `/${locale}/`;
      return NextResponse.redirect(url); 
    }
  */
  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};