import { describe, expect, it } from "vitest";

import { createSafeChatMetadata } from "@/lib/chat/history-metadata";

describe("chat history metadata", () => {
  it("keeps visible card summaries and tool names without sensitive card fields", () => {
    const metadata = createSafeChatMetadata({
      cards: [
        {
          email: "private@example.com",
          kind: "ticketForm",
          orders: [{ id: 12, label: "Order #12" }],
        },
        {
          items: [{ id_categorie: 4, cat_nom: "EDR" }],
          kind: "category",
        },
      ],
      tools: ["create_ticket", "list_categories", "create_ticket"],
    });
    expect(metadata.tools).toEqual(["create_ticket", "list_categories"]);
    expect(JSON.stringify(metadata)).not.toContain("private@example.com");
    expect(JSON.stringify(metadata)).not.toContain("Order #12");
    expect(metadata.cards).toEqual([
      { kind: "ticketForm", orderIds: [12] },
      { kind: "category", items: [{ id: 4, name: "EDR" }] },
    ]);
  });
});
