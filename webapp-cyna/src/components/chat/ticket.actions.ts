"use server";

// Server action for the in-chat ticket form. Resolves the logged-in user (to
// link id_compte) and flags the ticket as chatbot-originated. Same shared insert
// as the FAQ form.
import { createServerClient } from "@/lib/supabase/server-client";
import {
  createSupportTicket,
  type SupportTicketInput,
} from "@/lib/support/tickets";

export async function submitChatSupportTicket(input: SupportTicketInput) {
  let userId: string | null = null;
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    userId = null;
  }

  return createSupportTicket(input, { userId, origineChatbot: true });
}
