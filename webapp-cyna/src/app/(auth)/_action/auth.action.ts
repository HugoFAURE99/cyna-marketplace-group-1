"use server";

import { redirect } from "next/navigation";

import { validatePassword } from "@/lib/auth/password-policy";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";

type AuthActionState = {
  error?: string;
  errorKey?: string;
  successKey?: string;
} | null;

export async function login(
  locale: string,
  next: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { errorKey: "errorMissingFields" };

  try {
    const supabase = await createServerClient(formData.get("remember") === "on");
    // On récupère authData pour avoir l'ID de l'utilisateur[cite: 2]
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return { errorKey: "errorUnconfirmed" };
      }
      if (error.message.includes("Invalid login credentials")) {
        return { errorKey: "errorInvalidCredentials" };
      }
      return { errorKey: "errorUnavailable" };
    }

    // ==========================================
    // INTERCEPTION 2FA POUR LES ADMINS
    // ==========================================
    if (authData.user) {
      const { data: profile } = await supabase
        .from("utilisateur")
        .select("role")
        .eq("id_compte", authData.user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "Admin") {
        // Redirection forcée vers la page MFA avec la destination finale en paramètre
        const mfaUrl = `/mfa-verify?next=${encodeURIComponent(next)}`;
        redirect(localizedPath(locale, mfaUrl));
      }
    }
    // ==========================================

    redirect(localizedPath(locale, next));
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error; // Permet à Next.js de gérer le redirect()[cite: 2]
    console.error("[auth] login failed", error);
    return { errorKey: "errorUnavailable" };
  }
}
//==================================register=====================
export async function register(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  if (!email || !password || !confirmPassword || !username) {
    return { errorKey: "errorMissingFields" };
  }
  if (password !== confirmPassword) return { errorKey: "errorMismatch" };
  const passwordError = validatePassword(password);
  if (passwordError) return { errorKey: passwordError };

  try {
    const supabase = await createServerClient();
    const admin = createAdminClient();
    const { data: existingUser } = await admin
      .from("utilisateur")
      .select("adresse_mail")
      .ilike("adresse_mail", email)
      .maybeSingle();
    if (existingUser) return { errorKey: "errorEmailTaken" };

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?locale=${normaliseLocale(locale)}`,
      },
    });
    if (error) {
      return {
        errorKey: error.code === "weak_password" ? "errorTooShort" : "errorUnavailable",
      };
    }
    if (data.user) {
      const { error: profileError } = await admin.from("utilisateur").insert({
        adresse_mail: email,
        id_compte: data.user.id,
        is_actif: true,
        nom_complet: username,
        role: "client",
        token_connexion_stripe: "non_configure",
      });
      if (profileError) {
        await admin.auth.admin.deleteUser(data.user.id);
        return { errorKey: "errorUnavailable" };
      }
    }
    redirect(`/${normaliseLocale(locale)}/login?message=checkEmail`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth] registration failed", error);
    return { errorKey: "errorUnavailable" };
  }
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  const { getLocale } = await import("next-intl/server");
  redirect(`/${normaliseLocale(await getLocale())}`);
}
//=============================
export async function resetPassword(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { errorKey: "errorMissingFields" };
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?locale=${normaliseLocale(locale)}&next=/user-dashboard/update-password`,
    });
    return error ? { errorKey: "errorUnavailable" } : { successKey: "resetEmailSent" };
  } catch (error) {
    console.error("[auth] reset request failed", error);
    return { errorKey: "errorUnavailable" };
  }
}
//=============================
export async function updatePassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!password || !confirmPassword) return { errorKey: "errorMissingFields" };
  if (password !== confirmPassword) return { errorKey: "errorMismatch" };
  const passwordError = validatePassword(password);
  if (passwordError) return { errorKey: passwordError };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      errorKey: error.code === "weak_password" ? "errorTooShort" : "errorUpdateFailed",
    };
  }
  const { getLocale } = await import("next-intl/server");
  redirect(`/${normaliseLocale(await getLocale())}/login?message=updatePasswordSuccess`);
}

function normaliseLocale(locale: string) {
  return locale === "en" ? "en" : "fr";
}

function localizedPath(locale: string, candidate: string) {
  const safe = candidate.startsWith("/") && !candidate.startsWith("//")
    ? candidate
    : "/";
  if (/^\/(fr|en)(\/|$)/.test(safe)) return safe;
  const prefix = `/${normaliseLocale(locale)}`;
  return safe === "/" ? prefix : `${prefix}${safe}`;
}
