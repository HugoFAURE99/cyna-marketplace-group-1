// Shared support-ticket insert used by both the FAQ form action and the CynAI
// chatbot tool. Inserts via the service-role admin client (the table's RLS
// rejects anon inserts); the caller resolves the optional logged-in userId.
import "server-only";

import { z } from "zod";

import { SUPPORT_TICKET_CATEGORIES } from "@/lib/support/constants";
import { createAdminClient } from "@/lib/supabase/server";
import { OPEN_ADMIN_ACCESS_STATUSES } from "@/lib/support/admin-access";
import { isActiveClient, isActiveUser } from "@/lib/auth/roles";

export const supportTicketSchema = z.object({
  sujet: z.string().trim().min(1).max(200),
  email_contact: z.string().trim().min(1).max(254).email(),
  description: z.string().trim().min(1).max(5000),
  categorie: z.enum(SUPPORT_TICKET_CATEGORIES),
  orderId: z.number().int().positive().optional(),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;

export type CreateTicketResult =
  | { ok: true; id_support: string }
  | {
      ok: false;
      error: "authentication_required" | "database" | "duplicate" | "invalid" | "not_eligible";
    };

export async function createSupportTicket(
  input: SupportTicketInput,
  options: { userId?: string | null; origineChatbot?: boolean } = {},
): Promise<CreateTicketResult> {
  const parsed = supportTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "invalid" };
  }

  const supabase = createAdminClient();
  let email = parsed.data.email_contact;
  if (parsed.data.categorie === "admin_access") {
    if (!options.userId) return { ok: false, error: "authentication_required" };
    const { data: profile, error: profileError } = await supabase
      .from("utilisateur")
      .select("role, is_actif, adresse_mail")
      .eq("id_compte", options.userId)
      .maybeSingle();
    if (profileError || !profile || !isActiveClient(profile)) {
      return { ok: false, error: "not_eligible" };
    }

    const { data: existing, error: existingError } = await supabase
      .from("ticket_support")
      .select("id_support")
      .eq("id_compte", options.userId)
      .eq("categorie", "admin_access")
      .in("status", [...OPEN_ADMIN_ACCESS_STATUSES])
      .limit(1)
      .maybeSingle();
    if (existingError) return { ok: false, error: "database" };
    if (existing) return { ok: false, error: "duplicate" };
    email = profile.adresse_mail;
  }

  if (parsed.data.categorie === "mfa_reset") {
    if (!options.userId) return { ok: false, error: "authentication_required" };
    const { data: profile, error: profileError } = await supabase
      .from("utilisateur")
      .select("role, is_actif, adresse_mail")
      .eq("id_compte", options.userId)
      .maybeSingle();
    if (profileError || !profile || !isActiveUser(profile)) return { ok: false, error: "not_eligible" };
    const { data: existing, error: existingError } = await supabase
      .from("ticket_support")
      .select("id_support")
      .eq("id_compte", options.userId)
      .eq("categorie", "mfa_reset")
      .in("status", [...OPEN_ADMIN_ACCESS_STATUSES])
      .limit(1)
      .maybeSingle();
    if (existingError) return { ok: false, error: "database" };
    if (existing) return { ok: false, error: "duplicate" };
    email = profile.adresse_mail;
  }

  const { data, error } = await supabase
    .rpc("create_support_ticket", {
      p_sujet: parsed.data.sujet,
      p_email_contact: email,
      p_description: parsed.data.description,
      p_categorie: parsed.data.categorie,
      p_id_compte: options.userId ?? undefined,
      p_id_commande: parsed.data.orderId,
      p_origine_chatbot: options.origineChatbot ?? false,
    });

  if (error || typeof data !== "string") {
    console.error("[support] ticket insert failed", error);
    return { ok: false, error: "database" };
  }

  return { ok: true, id_support: data };
}
