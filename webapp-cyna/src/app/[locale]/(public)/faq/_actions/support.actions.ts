"use server";

// Thin server-action wrapper around the shared ticket insert. Resolves the
// logged-in user (if any) so the ticket is attached to their account, then
// delegates to the lib. Chatbot-originated tickets go through the same lib.
import { createServerClient } from "@/lib/supabase/server-client";
import {
  createSupportTicket,
  type SupportTicketInput,
} from "@/lib/support/tickets";

export async function submitSupportTicket(input: SupportTicketInput) {
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

  return createSupportTicket(input, { userId, origineChatbot: false });
}
