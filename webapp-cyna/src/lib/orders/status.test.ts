import { describe, expect, it } from "vitest";

import {
  getOrderStatusFilterEntries,
  isPaidOrderStatus,
  normalizeOrderStatus,
  orderStatusFilterValue,
} from "@/lib/orders/status";

describe("order status presentation", () => {
  it.each([
    ["En attente", "pending"],
    ["en_cours", "pending"],
    ["Validée", "paid"],
    ["Payée", "paid"],
    ["completed", "paid"],
    ["Échouée", "failed"],
    ["failed", "failed"],
    ["Annulée", "canceled"],
    ["cancelled", "canceled"],
    ["Expirée", "canceled"],
    ["unexpected", "unknown"],
  ])("maps %s to %s", (raw, expected) => {
    expect(normalizeOrderStatus(raw)).toBe(expected);
  });

  it("deduplicates legacy values into canonical filter entries", () => {
    const entries = getOrderStatusFilterEntries([
      "Validée",
      "paid",
      "En attente",
      "pending",
      "Custom",
    ]);
    expect(entries.map((entry) => entry.value)).toEqual([
      "paid",
      "pending",
      "unknown:custom",
    ]);
    expect(orderStatusFilterValue("Payée")).toBe("paid");
  });

  it("only includes paid aliases in commerce totals", () => {
    expect(isPaidOrderStatus("Validée")).toBe(true);
    expect(isPaidOrderStatus("Échouée")).toBe(false);
  });
});
