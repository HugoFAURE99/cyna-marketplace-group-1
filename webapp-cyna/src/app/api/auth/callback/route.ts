import { NextResponse } from "next/server";

import { getAuthCallbackFailure } from "@/lib/auth/callback-result";
import { sanitizeAuthNext } from "@/lib/auth/mfa-return";
import { createServerClient } from "@/lib/supabase/server-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") === "en" ? "en" : "fr";
  const next = searchParams.get("next") ?? "/";
  const flow = searchParams.get("flow");
  const redirectPath = sanitizeAuthNext(next, locale);

  if (code) {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Signup confirmation has no meaningful destination — land on the login
      // page with a clear "email confirmed" message instead of silently
      // dropping the user on the home page. Recovery / next flows are unchanged.
      if (flow === "signup") {
        const loginUrl = new URL(`/${locale}/login`, request.url);
        loginUrl.searchParams.set("message", "emailConfirmed");
        return NextResponse.redirect(loginUrl);
      }
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }
  }

  const result = getAuthCallbackFailure(searchParams);
  const loginUrl = new URL(`/${locale}/login`, request.url);
  loginUrl.searchParams.set(result.parameter, result.key);
  return NextResponse.redirect(loginUrl);
}
