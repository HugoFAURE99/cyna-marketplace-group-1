// Shared support-ticket insert used by both the FAQ form action and the CynAI
// chatbot tool. Inserts via the service-role admin client (the table's RLS
// rejects anon inserts); the caller resolves the optional logged-in userId.
import "server-only";

import { z } from "zod";

import { SUPPORT_TICKET_CATEGORIES } from "@/lib/support/constants";
import { createAdminClient } from "@/lib/supabase/server";

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
  | { ok: false };

export async function createSupportTicket(
  input: SupportTicketInput,
  options: { userId?: string | null; origineChatbot?: boolean } = {},
): Promise<CreateTicketResult> {
  const parsed = supportTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .rpc("create_support_ticket", {
      p_sujet: parsed.data.sujet,
      p_email_contact: parsed.data.email_contact,
      p_description: parsed.data.description,
      p_categorie: parsed.data.categorie,
      p_id_compte: options.userId ?? undefined,
      p_id_commande: parsed.data.orderId,
      p_origine_chatbot: options.origineChatbot ?? false,
    });

  if (error || typeof data !== "string") {
    console.error("[support] ticket insert failed", error);
    return { ok: false };
  }

  return { ok: true, id_support: data };
}
