// CynAI tool definitions + dispatcher. The tools reuse the existing public
// catalog helpers so the chatbot never sees anything the public site doesn't.
import "server-only";

import { Type, type FunctionDeclaration, type Tool } from "@google/genai";

import type { ChatCardPayload } from "@/lib/gemini/types";
import type { Locale } from "@/lib/i18n/translations";
import { getCatalogCategories } from "@/lib/products/public-catalog";
import { searchCatalog, toSuggestion } from "@/lib/products/search-products";
import { getUserOrderOptions } from "@/lib/support/orders";

// CynAI persona. Kept short; the heavy lifting is done by the tools.
export const SYSTEM_INSTRUCTION = `You are CynAI, the shopping assistant for CYNA, a marketplace selling cybersecurity SaaS licences (SOC, EDR, XDR, firewalls and similar).
- Always reply in the same language the user writes in.
- Keep replies short and to the point — usually 1 to 3 sentences. Use light Markdown only when it genuinely helps.
- Use the tools to look up real products and categories before recommending anything. Never invent products, prices or categories.
- When a tool returns products or categories, introduce them in one short sentence — the app renders the actual cards, so do not paste URLs or repeat every field.
- When the user wants to open a support ticket or report a problem, call open_support_form. It shows a short form to everyone and prefills account details for signed-in users. Do not collect the details yourself.
- If they just want the Help & Support page (FAQ + form), call show_support_page instead.
- Stay on topic (CYNA, its catalog, cybersecurity, support) and politely decline unrelated requests.`;

export const SEARCH_PRODUCTS_TOOL = "search_products";
export const LIST_CATEGORIES_TOOL = "list_categories";
export const SHOW_SUPPORT_TOOL = "show_support_page";
export const OPEN_TICKET_FORM_TOOL = "open_support_form";

const searchProductsDeclaration: FunctionDeclaration = {
  name: SEARCH_PRODUCTS_TOOL,
  description:
    "Search the CYNA product catalog by keyword and/or category to recommend cybersecurity SaaS products. Returns matching products with names, prices and stock.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description:
          "Free-text search terms (product name, need or keyword). Optional — omit to list a whole category.",
      },
      categoryId: {
        type: Type.NUMBER,
        description:
          "Optional category id to restrict the search. Call list_categories first if you need the id.",
      },
    },
    required: [],
  },
};

const listCategoriesDeclaration: FunctionDeclaration = {
  name: LIST_CATEGORIES_TOOL,
  description:
    "List CYNA product categories with their ids and names. Use to answer 'what do you sell' or before filtering a product search by category.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const showSupportDeclaration: FunctionDeclaration = {
  name: SHOW_SUPPORT_TOOL,
  description:
    "Show the user a link card to the Help & Support page (FAQ + support ticket form). Call this when they just want to find help or browse the FAQ.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

const openTicketFormDeclaration: FunctionDeclaration = {
  name: OPEN_TICKET_FORM_TOOL,
  description:
    "Show the user a short support-ticket form inside the chat (prefilled with their info when signed in, with an optional order link). Call this when they want to open a ticket or report a problem — do not collect the details yourself.",
  parameters: {
    type: Type.OBJECT,
    properties: {},
    required: [],
  },
};

export const CHAT_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      searchProductsDeclaration,
      listCategoriesDeclaration,
      showSupportDeclaration,
      openTicketFormDeclaration,
    ],
  },
];

// Keep card counts small so the chat stays clean (2–3 items max).
const MAX_PRODUCT_RESULTS = 3;
const MAX_CATEGORY_RESULTS = 3;

export type ToolContext = {
  userId: string | null;
  userEmail: string | null;
};

export type ToolRunResult = {
  // Compact JSON returned to Gemini so it can phrase its answer.
  forModel: Record<string, unknown>;
  // Structured payload the client renders as cards (null = nothing to render).
  card: ChatCardPayload | null;
};

export async function runChatTool(
  name: string,
  args: Record<string, unknown>,
  locale: Locale,
  ctx: ToolContext = { userId: null, userEmail: null },
): Promise<ToolRunResult> {
  if (name === SEARCH_PRODUCTS_TOOL) {
    const query = typeof args.query === "string" ? args.query : undefined;
    const categoryId =
      typeof args.categoryId === "number" ? args.categoryId : undefined;

    const products = (
      await searchCatalog(
        { query, categoryIds: categoryId !== undefined ? [categoryId] : [] },
        locale,
      )
    ).slice(0, MAX_PRODUCT_RESULTS);
    const suggestions = products.map(toSuggestion);

    return {
      forModel: {
        count: suggestions.length,
        products: suggestions.map((product) => ({
          name: product.nom_pro,
          category: product.cat_nom,
          priceCents: product.priceCents,
          billing: product.type_facturation,
          inStock: product.quantite_produit > 0,
        })),
      },
      card:
        suggestions.length > 0
          ? { kind: "product", items: suggestions }
          : null,
    };
  }

  if (name === LIST_CATEGORIES_TOOL) {
    const allCategories = await getCatalogCategories(locale);
    const categories = allCategories.slice(0, MAX_CATEGORY_RESULTS);
    return {
      forModel: {
        totalCount: allCategories.length,
        shown: categories.map((category) => category.cat_nom),
      },
      card:
        categories.length > 0
          ? { kind: "category", items: categories }
          : null,
    };
  }

  if (name === SHOW_SUPPORT_TOOL) {
    return { forModel: { ok: true }, card: { kind: "support" } };
  }

  if (name === OPEN_TICKET_FORM_TOOL) {
    const orders = ctx.userId ? await getUserOrderOptions(ctx.userId, locale) : [];
    return {
      forModel: { ok: true, formShown: true },
      card: { kind: "ticketForm", email: ctx.userEmail ?? "", orders },
    };
  }

  return { forModel: { error: `Unknown tool: ${name}` }, card: null };
}
