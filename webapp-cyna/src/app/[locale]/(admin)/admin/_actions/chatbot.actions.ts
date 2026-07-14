"use server";

import { revalidatePath } from "next/cache";

import { requireActiveAal2Admin } from "@/lib/auth/admin-guard";
import { purgeExpiredChatConversations } from "@/lib/chat/persistence";
import { createAdminClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database.types";

export type ChatConversationListItem = {
  accountEmail: string | null;
  accountName: string | null;
  createdAt: string;
  expiresAt: string;
  id: string;
  isGuest: boolean;
  locale: string;
  messageCount: number;
  preview: string;
  updatedAt: string;
};

export type AdminChatMessage = {
  content: string;
  createdAt: string;
  id: number;
  metadata: Json;
  role: string;
  status: string;
};

export type AdminChatTranscript = ChatConversationListItem & {
  messages: AdminChatMessage[];
};

export async function listChatConversations(input: {
  audience?: "account" | "all" | "guest";
  locale?: "en" | "fr";
  page?: number;
  search?: string;
}) {
  await requireActiveAal2Admin();
  await purgeExpiredChatConversations();
  const admin = createAdminClient();
  let query = admin
    .from("chat_conversation")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("updated_at", { ascending: false })
    .limit(1000);
  if (input.locale) query = query.eq("locale", input.locale);
  if (input.audience === "guest") query = query.is("id_compte", null);
  if (input.audience === "account") query = query.not("id_compte", "is", null);
  const { data: conversations, error } = await query;
  if (error) throw error;

  const conversationIds = (conversations ?? []).map((row) => row.id_conversation);
  const accountIds = [
    ...new Set((conversations ?? []).flatMap((row) => (row.id_compte ? [row.id_compte] : []))),
  ];
  const [{ data: messages }, { data: accounts }] = await Promise.all([
    conversationIds.length
      ? admin
          .from("chat_message")
          .select("id_conversation, content, created_at")
          .in("id_conversation", conversationIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    accountIds.length
      ? admin
          .from("utilisateur")
          .select("id_compte, adresse_mail, nom_complet")
          .in("id_compte", accountIds)
      : Promise.resolve({ data: [] }),
  ]);
  const accountMap = new Map((accounts ?? []).map((account) => [account.id_compte, account]));
  const messageMap = new Map<
    string,
    { count: number; preview: string; searchText: string }
  >();
  for (const message of messages ?? []) {
    const current = messageMap.get(message.id_conversation) ?? {
      count: 0,
      preview: "",
      searchText: "",
    };
    current.count += 1;
    if (!current.preview) current.preview = message.content;
    current.searchText = `${current.searchText} ${message.content}`.slice(-50_000);
    messageMap.set(message.id_conversation, current);
  }

  const normalizedSearch = input.search?.trim().toLocaleLowerCase() ?? "";
  const items: ChatConversationListItem[] = (conversations ?? [])
    .map((row) => {
      const account = row.id_compte ? accountMap.get(row.id_compte) : null;
      const summary = messageMap.get(row.id_conversation);
      return {
        accountEmail: account?.adresse_mail ?? null,
        accountName: account?.nom_complet ?? null,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
        id: row.id_conversation,
        isGuest: row.id_compte === null,
        locale: row.locale,
        messageCount: summary?.count ?? 0,
        preview: summary?.preview ?? "",
        updatedAt: row.updated_at,
      };
    })
    .filter((item) => {
      if (!normalizedSearch) return true;
      return [
        item.id,
        item.accountEmail,
        item.accountName,
        messageMap.get(item.id)?.searchText,
      ]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch));
    });

  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, input.page ?? 1), totalPages);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    total: items.length,
    totalPages,
  };
}

export async function getChatTranscript(
  id: string,
): Promise<AdminChatTranscript | null> {
  await requireActiveAal2Admin();
  await purgeExpiredChatConversations();
  const admin = createAdminClient();
  const { data: conversation } = await admin
    .from("chat_conversation")
    .select("*")
    .eq("id_conversation", id)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (!conversation) return null;

  const [{ data: messages }, { data: account }] = await Promise.all([
    admin
      .from("chat_message")
      .select("*")
      .eq("id_conversation", id)
      .order("created_at", { ascending: true }),
    conversation.id_compte
      ? admin
          .from("utilisateur")
          .select("adresse_mail, nom_complet")
          .eq("id_compte", conversation.id_compte)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    accountEmail: account?.adresse_mail ?? null,
    accountName: account?.nom_complet ?? null,
    createdAt: conversation.created_at,
    expiresAt: conversation.expires_at,
    id,
    isGuest: conversation.id_compte === null,
    locale: conversation.locale,
    messageCount: messages?.length ?? 0,
    messages: (messages ?? []).map((message) => ({
      content: message.content,
      createdAt: message.created_at,
      id: message.id_message,
      metadata: message.metadata,
      role: message.role,
      status: message.status,
    })),
    preview: messages?.[0]?.content ?? "",
    updatedAt: conversation.updated_at,
  };
}

export async function deleteChatConversation(id: string) {
  await requireActiveAal2Admin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("chat_conversation")
    .delete()
    .eq("id_conversation", id);
  if (error) return { error: "delete_failed", ok: false as const };
  revalidatePath("/admin/chatbot");
  return { ok: true as const };
}
