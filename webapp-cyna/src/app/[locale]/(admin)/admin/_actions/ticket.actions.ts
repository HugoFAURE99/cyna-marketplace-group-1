"use server";

import { createAdminClient } from "@/lib/supabase/server";
import type { Enums } from "@/types/database.types";

export type TicketRow = {
  id_support: string;
  sujet: string;
  categorie: string;
  status: string;
  email_contact: string;
  description: string | null;
  id_compte: string | null;
  id_commande: number | null;
  date_creation: string | null;
  date_fermeture: string | null;
  updated_at: string;
  origine_chatbot: boolean | null;
  client_name: string | null;
  message_count: number;
};

export type TicketDetail = TicketRow & {
  messages: TicketMessage[];
};

export type TicketMessage = {
  id_message: number;
  contenu: string;
  sender: string;
  created_at: string;
  auteur_id: string | null;
};

export async function getTickets(): Promise<TicketRow[]> {
  const supabase = await createAdminClient();

  const { data: tickets, error } = await supabase
    .from("ticket_support")
    .select("*")
    .order("date_creation", { ascending: false });

  if (error || !tickets) return [];

  const compteIds = [
    ...new Set(
      tickets.map((ticket) => ticket.id_compte).filter((id): id is string => Boolean(id))
    ),
  ];

  const userMap = new Map<string, string>();
  if (compteIds.length > 0) {
    const { data: users } = await supabase
      .from("utilisateur")
      .select("id_compte, nom_complet")
      .in("id_compte", compteIds);

    for (const u of users ?? []) {
      userMap.set(u.id_compte, u.nom_complet);
    }
  }

  const ticketIds = tickets.map((ticket) => ticket.id_support);
  const messageCounts = new Map<string, number>();

  if (ticketIds.length > 0) {
    const { data: msgs } = await supabase
      .from("ticket_support_message")
      .select("id_support");

    if (msgs) {
      for (const m of msgs) {
        messageCounts.set(m.id_support, (messageCounts.get(m.id_support) || 0) + 1);
      }
    }
  }

  return tickets.map((t) => ({
    id_support: t.id_support,
    sujet: t.sujet,
    categorie: t.categorie,
    status: t.status,
    email_contact: t.email_contact,
    description: t.description,
    id_compte: t.id_compte,
    id_commande: t.id_commande,
    date_creation: t.date_creation,
    date_fermeture: t.date_fermeture,
    updated_at: t.updated_at,
    origine_chatbot: t.origine_chatbot,
    client_name: t.id_compte ? userMap.get(t.id_compte) || null : null,
    message_count: messageCounts.get(t.id_support) || 0,
  }));
}

export async function getTicketDetail(
  id: string
): Promise<TicketDetail | null> {
  const supabase = await createAdminClient();

  const { data: ticket, error } = await supabase
    .from("ticket_support")
    .select("*")
    .eq("id_support", id)
    .single();

  if (error || !ticket) return null;

  const t = ticket;

  let client_name: string | null = null;
  if (t.id_compte) {
    const { data: user } = await supabase
      .from("utilisateur")
      .select("nom_complet")
      .eq("id_compte", t.id_compte)
      .single();
    if (user) client_name = user.nom_complet;
  }

  const { data: messages } = await supabase
    .from("ticket_support_message")
    .select("id_message, contenu, sender, created_at, auteur_id")
    .eq("id_support", id)
    .order("created_at", { ascending: true });

  return {
    id_support: t.id_support,
    sujet: t.sujet,
    categorie: t.categorie,
    status: t.status,
    email_contact: t.email_contact,
    description: t.description,
    id_compte: t.id_compte,
    id_commande: t.id_commande,
    date_creation: t.date_creation,
    date_fermeture: t.date_fermeture,
    updated_at: t.updated_at,
    origine_chatbot: t.origine_chatbot,
    client_name,
    message_count: messages?.length || 0,
    messages: (messages ?? []).map((m) => ({
      id_message: m.id_message,
      contenu: m.contenu,
      sender: m.sender,
      created_at: m.created_at,
      auteur_id: m.auteur_id,
    })),
  };
}

export async function updateTicketStatus(
  id: string,
  status: Enums<"support_ticket_status">
): Promise<void> {
  const supabase = await createAdminClient();

  const now = new Date().toISOString();

  await supabase
    .from("ticket_support")
    .update({
      status,
      updated_at: now,
      ...(status === "closed" ? { date_fermeture: now } : {}),
    })
    .eq("id_support", id);
}

export async function bulkUpdateTicketStatus(
  ids: string[],
  status: Enums<"support_ticket_status">
): Promise<void> {
  for (const id of ids) {
    await updateTicketStatus(id, status);
  }
}
