import "server-only";

import { createHash } from "node:crypto";

import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export const CHAT_GUEST_COOKIE = "cyna_chat_guest";
export const CHAT_RETENTION_DAYS = 90;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function expiresAt(now = new Date()) {
  const expiry = new Date(now);
  expiry.setUTCDate(expiry.getUTCDate() + CHAT_RETENTION_DAYS);
  return expiry.toISOString();
}

export function hashGuestSession(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function purgeExpiredChatConversations() {
  const admin = createAdminClient();
  const { error } = await admin.rpc("purge_expired_chat_conversations");
  if (error) console.error("[chat-history] cleanup failed", error);
}

export async function resolveChatConversation(input: {
  accountId: string | null;
  conversationId?: string;
  guestSessionHash: string;
  locale: Locale;
}) {
  const admin = createAdminClient();
  await purgeExpiredChatConversations();

  if (input.conversationId && UUID_PATTERN.test(input.conversationId)) {
    const { data: existing } = await admin
      .from("chat_conversation")
      .select("id_conversation, id_compte, guest_session_hash")
      .eq("id_conversation", input.conversationId)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    const accountOwned =
      Boolean(input.accountId) && existing?.id_compte === input.accountId;
    const guestOwned =
      existing?.id_compte === null &&
      existing.guest_session_hash === input.guestSessionHash;
    if (existing && (accountOwned || guestOwned)) {
      const { error } = await admin
        .from("chat_conversation")
        .update({
          expires_at: expiresAt(),
          guest_session_hash: input.accountId ? null : input.guestSessionHash,
          id_compte: input.accountId,
          locale: input.locale,
          updated_at: new Date().toISOString(),
        })
        .eq("id_conversation", existing.id_conversation);
      if (error) throw error;
      return existing.id_conversation;
    }
  }

  const { data, error } = await admin
    .from("chat_conversation")
    .insert({
      expires_at: expiresAt(),
      guest_session_hash: input.accountId ? null : input.guestSessionHash,
      id_compte: input.accountId,
      locale: input.locale,
    })
    .select("id_conversation")
    .single();
  if (error || !data) throw error ?? new Error("CHAT_CONVERSATION_CREATE_FAILED");
  return data.id_conversation;
}

export async function appendChatMessage(input: {
  content: string;
  conversationId: string;
  metadata?: Json;
  role: "assistant" | "user";
  status?: "completed" | "error";
}) {
  const content = input.content.trim().slice(0, 20_000);
  if (!content) return;
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error: messageError } = await admin.from("chat_message").insert({
    content,
    id_conversation: input.conversationId,
    metadata: input.metadata ?? {},
    role: input.role,
    status: input.status ?? "completed",
  });
  if (messageError) throw messageError;

  const { error: conversationError } = await admin
    .from("chat_conversation")
    .update({ expires_at: expiresAt(), updated_at: now })
    .eq("id_conversation", input.conversationId);
  if (conversationError) throw conversationError;
}
