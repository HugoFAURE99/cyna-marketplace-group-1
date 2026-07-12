"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { validatePassword } from "@/lib/auth/password-policy";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";

type ActionState = { errorKey?: string; successKey?: string; rawError?: string };

export async function updateEmail(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState | null> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { errorKey: "errorMissingFields" };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { errorKey: "errorUpdateFailed" };

  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { errorKey: "errorUpdateFailed" };

  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("utilisateur")
    .update({ adresse_mail: email })
    .eq("id_compte", user.id);
  if (profileError) return { errorKey: "errorUpdateFailed" };

  revalidatePath("/user-dashboard");
  return { successKey: "successEmailUpdate" };
}

export async function updateDashboardPassword(
  _prevState: ActionState | null,
  formData: FormData,
): Promise<ActionState | null> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("password_confirm") ?? "");
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
  const locale = await getLocale();
  redirect(`/${locale}/user-dashboard/infos?updated=password`);
}

export async function requestPasswordResetEmail(
  _prevState: ActionState | null,
  _formData: FormData,
): Promise<ActionState | null> {
  void _prevState;
  void _formData;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { errorKey: "errorUpdateFailed" };

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?locale=${await getLocale()}&next=/user-dashboard/update-password`,
  });
  if (error) {
    console.error("[auth] reset e-mail failed", error);
    return { errorKey: "errorUpdateFailed", rawError: error.message };
  }
  return { successKey: "successResetEmailSent" };
}
