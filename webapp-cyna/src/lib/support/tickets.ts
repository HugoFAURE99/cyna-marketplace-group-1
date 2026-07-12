// Shared support-ticket insert used by both the FAQ form action and the CynAI
// chatbot tool. Inserts via the service-role admin client (the table's RLS
// rejects anon inserts); the caller resolves the optional logged-in userId.
import "server-only";

import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database.types";

export const supportTicketSchema = z.object({
  sujet: z.string().trim().min(1).max(200),
  email_contact: z.string().trim().min(1).max(254).email(),
  description: z.string().trim().min(1).max(5000),
  orderId: z.number().int().positive().optional(),
});

export type SupportTicketInput = z.infer<typeof supportTicketSchema>;

export type CreateTicketResult =
  | { ok: true; id_support: string }
  | { ok: false };

export async function createSupportTicket(
  input: SupportTicketInput,
  options: { userId?: string | null; origineChatbot?: boolean } = {},
): Promise<CreateTicketResult> {
  const parsed = supportTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false };
  }

  const description = parsed.data.description?.trim();
  if (parsed.data.orderId) {
    if (!options.userId) return { ok: false };
    const ownership = await createAdminClient()
      .from("commande")
      .select("id_commande")
      .eq("id_commande", parsed.data.orderId)
      .eq("id_compte", options.userId)
      .maybeSingle();
    if (ownership.error || !ownership.data) return { ok: false };
  }
  const payload: TablesInsert<"ticket_support"> = {
    sujet: parsed.data.sujet,
    email_contact: parsed.data.email_contact,
    description: description && description.length > 0 ? description : null,
    id_compte: options.userId ?? null,
    id_commande: parsed.data.orderId ?? null,
    origine_chatbot: options.origineChatbot ?? false,
  };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("ticket_support")
    .insert(payload)
    .select("id_support")
    .single();

  if (error || !data) {
    console.error("[support] ticket insert failed", error);
    return { ok: false };
  }

  return { ok: true, id_support: data.id_support };
}
