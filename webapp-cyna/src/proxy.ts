import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
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

  // Refresh the Supabase session when needed, even while routes stay public.
  await supabase.auth.getUser();

  /* =========================================================================
     Future protected-route redirects

     When login gating is ready, replace the refresh-only getUser() call above
     with the destructuring call below, then uncomment the route checks.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isProtectedRoute =
    url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin");
  const isAuthRoute =
    url.pathname.startsWith("/login") || url.pathname.startsWith("/register");

  // Redirect anonymous users away from protected sections.
  if (!user && isProtectedRoute) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect signed-in users away from login and registration screens.
  if (user && isAuthRoute) {
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  ========================================================================= */

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
