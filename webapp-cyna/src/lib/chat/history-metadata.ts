import type { ChatCardPayload } from "@/lib/gemini/types";
import type { Json } from "@/types/database.types";

export type SafeChatMetadata = {
  cards: Json[];
  tools: string[];
};

export function summarizeChatCard(card: ChatCardPayload): Json {
  switch (card.kind) {
    case "product":
      return {
        kind: card.kind,
        items: card.items.map((item) => ({
          id: item.id_produit,
          name: item.nom_pro,
        })),
      };
    case "category":
      return {
        kind: card.kind,
        items: card.items.map((item) => ({
          id: item.id_categorie,
          name: item.cat_nom,
        })),
      };
    case "ticketForm":
      return {
        kind: card.kind,
        orderIds: card.orders.map((order) => order.id),
      };
    default:
      return { kind: card.kind };
  }
}

export function createSafeChatMetadata(input: {
  cards: ChatCardPayload[];
  tools: string[];
}): SafeChatMetadata {
  return {
    cards: input.cards.map(summarizeChatCard),
    tools: [...new Set(input.tools.filter(Boolean))].slice(0, 20),
  };
}
