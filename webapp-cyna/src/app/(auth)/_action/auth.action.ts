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
  next: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { errorKey: "errorMissingFields" };

  try {
    const supabase = await createServerClient(formData.get("remember") === "on");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        return { errorKey: "errorUnconfirmed" };
      }
      if (error.message.includes("Invalid login credentials")) {
        return { errorKey: "errorInvalidCredentials" };
      }
      return { errorKey: "errorUnavailable" };
    }
    redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth] login failed", error);
    return { errorKey: "errorUnavailable" };
  }
}

export async function register(
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
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
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
    redirect("/login?message=checkEmail");
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("[auth] registration failed", error);
    return { errorKey: "errorUnavailable" };
  }
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { errorKey: "errorMissingFields" };
  try {
    const supabase = await createServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?next=/user-dashboard/update-password`,
    });
    return error ? { errorKey: "errorUnavailable" } : { successKey: "resetEmailSent" };
  } catch (error) {
    console.error("[auth] reset request failed", error);
    return { errorKey: "errorUnavailable" };
  }
}

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
  redirect("/login?message=updatePasswordSuccess");
}
