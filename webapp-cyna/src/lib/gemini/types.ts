// Shared chat types used by the /api/chat route and the client chat widget.
import type { SearchSuggestion } from "@/lib/products/search-products";

export type ChatRole = "user" | "assistant";

// One conversation turn as exchanged between the client and the API.
export type ChatTurn = {
  role: ChatRole;
  content: string;
};

// Slim category shape rendered as a card (matches getCatalogCategories()).
export type ChatCategoryItem = {
  id_categorie: number;
  cat_nom: string;
};

// One of the signed-in user's orders, offered in the in-chat ticket form.
export type ChatOrderOption = {
  id: number;
  label: string;
};

// Structured tool output the client renders as an interactive card. Card events
// are streamed one item at a time so they reveal smoothly in the UI.
export type ChatCardPayload =
  | { kind: "product"; items: SearchSuggestion[] }
  | { kind: "category"; items: ChatCategoryItem[] }
  | { kind: "support" }
  | { kind: "ticketForm"; email: string; orders: ChatOrderOption[] };

// NDJSON events streamed from /api/chat to the client (one JSON object per line).
export type ChatStreamEvent =
  | { type: "card"; card: ChatCardPayload }
  | { type: "text"; value: string }
  | { type: "done" }
  | { type: "error"; message: string };
