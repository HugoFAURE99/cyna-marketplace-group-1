import { describe, expect, it } from "vitest";

import { aggregateCommerceReport, isCompletedOrderStatus, type CommerceOrder } from "@/lib/admin/commerce-report-core";
import { createReportRange } from "@/lib/admin/report-range";
import { aggregateSubscriptionHealth } from "@/lib/admin/subscription-health";

function subscriptionHealth(active = 0, scheduled = 0) {
  return aggregateSubscriptionHealth({
    generatedAt: new Date("2026-07-14T12:00:00Z"),
    horizon: 30,
    subscriptions: Array.from({ length: active }, (_, index) => ({
      billingPlan: "mensuel",
      contactEmail: null,
      customerName: null,
      endDate: "2026-07-20T10:00:00Z",
      id: index + 1,
      orderId: index + 1,
      priceCents: 1200,
      productId: 7,
      productName: "Shield",
      scheduledCancellation: index < scheduled,
      seats: 1,
      status: "active",
    })),
  });
}

function order(overrides: Partial<CommerceOrder> = {}): CommerceOrder {
  return {
    id: 1,
    customerId: "account-1",
    guestEmail: null,
    date: "2026-07-10T10:00:00Z",
    status: "Validée",
    total: 120,
    lines: [{ billingPlan: "mensuel", categoryId: 2, categoryName: "EDR", productId: 7, productName: "Shield", quantity: 2, subtotal: 120 }],
    ...overrides,
  };
}

describe("commerce report ranges", () => {
  it("builds presets and equal-length previous periods", () => {
    const range = createReportRange("7d", { now: new Date("2026-07-14T12:00:00Z") });
    expect(range).toMatchObject({ from: "2026-07-08", to: "2026-07-14", previousFrom: "2026-07-01", previousTo: "2026-07-07" });
  });

  it("uses Europe/Paris DST boundaries", () => {
    const range = createReportRange("custom", { from: "2026-03-29", to: "2026-03-29" });
    expect(range.fromIso).toBe("2026-03-28T23:00:00.000Z");
    expect(range.toExclusiveIso).toBe("2026-03-29T22:00:00.000Z");
  });

  it("rejects reversed and over-366-day custom ranges", () => {
    expect(() => createReportRange("custom", { from: "2026-07-02", to: "2026-07-01" })).toThrow("INVALID_RANGE");
    expect(() => createReportRange("custom", { from: "2025-01-01", to: "2026-01-02" })).toThrow("INVALID_RANGE");
  });
});

describe("commerce aggregation", () => {
  const range = createReportRange("custom", { from: "2026-07-08", to: "2026-07-14" });

  it.each(["Validée", "validee", "payee", "paid", "completed", "active"])("recognizes completed legacy status %s", (status) => {
    expect(isCompletedOrderStatus(status)).toBe(true);
  });

  it("excludes pending/failed orders and aggregates populated data", () => {
    const data = aggregateCommerceReport({
      locale: "fr",
      range,
      subscriptionHealth: subscriptionHealth(4, 1),
      generatedAt: new Date("2026-07-14T12:00:00Z"),
      orders: [
        order(),
        order({ id: 2, customerId: null, guestEmail: "GUEST@example.com", total: 80, lines: [{ billingPlan: "annuel", categoryId: 3, categoryName: "XDR", productId: 9, productName: "Watch", quantity: 1, subtotal: 80 }] }),
        order({ id: 3, status: "En attente", total: 999 }),
        order({ id: 4, status: "Échouée", total: 999 }),
        order({ id: 5, date: "2026-07-03T10:00:00Z", total: 100 }),
      ],
    });
    expect(data.current).toMatchObject({ grossRevenue: 200, orderCount: 2, averageOrderValue: 100, uniqueCustomers: 2 });
    expect(data.previous.grossRevenue).toBe(100);
    expect(data.current.changes.grossRevenue).toBe(100);
    expect(data.topProducts.map((item) => item.name)).toEqual(["Shield", "Watch"]);
    expect(data.categories).toHaveLength(2);
    expect(data.billingMix).toHaveLength(2);
    expect(data.subscriptions).toMatchObject({ active: 4, scheduledCancellations: 1, upcomingRenewalCount: 3, scheduledEndingCount: 1 });
  });

  it("returns a valid empty report", () => {
    const data = aggregateCommerceReport({ locale: "en", range, subscriptionHealth: subscriptionHealth(), orders: [] });
    expect(data.current.grossRevenue).toBe(0);
    expect(data.current.changes.grossRevenue).toBe(0);
    expect(data.trend).toHaveLength(7);
    expect(data.topProducts).toEqual([]);
  });
});
