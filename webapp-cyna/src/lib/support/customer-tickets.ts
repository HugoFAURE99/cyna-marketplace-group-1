import "server-only";

import { createServerClient } from "@/lib/supabase/server-client";
import type { Enums } from "@/types/database.types";

export type TicketOrder = {
  id_commande: number;
  date_commande: string;
  ligne_commande: {
    prix_tarif: {
      produit: {
        produit_traduction: { langue: string; nom_pro: string }[];
      } | null;
    } | null;
  }[];
} | null;

export type CustomerTicketSummary = {
  categorie: Enums<"support_ticket_category">;
  date_creation: string | null;
  id_commande: number | null;
  id_support: string;
  status: Enums<"support_ticket_status">;
  sujet: string;
  updated_at: string;
  commande: TicketOrder;
};

export type CustomerTicketDetail = CustomerTicketSummary & {
  date_fermeture: string | null;
  ticket_support_message: {
    contenu: string;
    created_at: string;
    id_message: number;
    sender: Enums<"support_message_sender">;
  }[];
};

const orderSelection = `
  commande (
    id_commande,
    date_commande,
    ligne_commande (
      prix_tarif (
        produit (produit_traduction (langue, nom_pro))
      )
    )
  )
`;

export async function getCustomerTickets(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("ticket_support")
    .select(`
      id_support, sujet, categorie, status, date_creation, updated_at,
      id_commande, ${orderSelection}
    `)
    .eq("id_compte", userId)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`TICKET_LIST_QUERY_FAILED: ${error.message}`);
  return (data ?? []) as unknown as CustomerTicketSummary[];
}

export async function getCustomerTicket(userId: string, ticketId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("ticket_support")
    .select(`
      id_support, sujet, categorie, status, date_creation, date_fermeture,
      updated_at, id_commande, ${orderSelection},
      ticket_support_message (
        id_message, sender, contenu, created_at
      )
    `)
    .eq("id_compte", userId)
    .eq("id_support", ticketId)
    .order("created_at", {
      referencedTable: "ticket_support_message",
      ascending: true,
    })
    .maybeSingle();

  if (error) throw new Error(`TICKET_DETAIL_QUERY_FAILED: ${error.message}`);
  return data as unknown as CustomerTicketDetail | null;
}

export function ticketOrderLabel(order: TicketOrder, locale: string) {
  if (!order) return null;
  const names = order.ligne_commande
    .map((line) => {
      const translations = line.prix_tarif?.produit?.produit_traduction ?? [];
      return translations.find((item) => item.langue === locale)?.nom_pro
        ?? translations.find((item) => item.langue === "fr")?.nom_pro
        ?? translations[0]?.nom_pro;
    })
    .filter((name): name is string => Boolean(name));
  const products = names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(order.date_commande),
  );
  return `#${order.id_commande} · ${products ?? "—"} · ${date}`;
}
