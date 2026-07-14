"use server";

import { createServerClient } from "@/lib/supabase/server-client";
import { createSupportTicket } from "@/lib/support/tickets";

export type MfaRecoveryResult =
  | { ok: true; ticketId: string }
  | { ok: false; error: "authentication_required" | "duplicate" | "unavailable" };

export async function requestMfaRecovery(locale: string): Promise<MfaRecoveryResult> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "authentication_required" };
  const isEnglish = locale === "en";
  const result = await createSupportTicket({
    categorie: "mfa_reset",
    sujet: isEnglish ? "Two-factor authentication reset" : "Réinitialisation de l’authentification à deux facteurs",
    email_contact: user.email,
    description: isEnglish
      ? "I no longer have access to my authenticator and request an identity-verified MFA reset."
      : "Je n’ai plus accès à mon application d’authentification et demande une réinitialisation MFA après vérification de mon identité.",
  }, { userId: user.id });
  if (result.ok) return { ok: true, ticketId: result.id_support };
  if (result.error === "duplicate") return { ok: false, error: "duplicate" };
  if (result.error === "authentication_required") return { ok: false, error: "authentication_required" };
  return { ok: false, error: "unavailable" };
}
