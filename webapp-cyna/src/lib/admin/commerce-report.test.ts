import { describe, expect, it } from "vitest";

import {
  aggregateCommerceReport,
  isCompletedOrderStatus,
  type CommerceOrder,
  type CommerceOrderLine,
} from "@/lib/admin/commerce-report-core";
import {
  createReportRange,
  validateCustomReportRange,
} from "@/lib/admin/report-range";
import { aggregateSubscriptionHealth } from "@/lib/admin/subscription-health";

const NOW = new Date("2026-07-14T12:00:00Z");

function subscriptionHealth(active = 0, scheduled = 0) {
  return aggregateSubscriptionHealth({
    generatedAt: NOW,
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

function line(overrides: Partial<CommerceOrderLine> = {}): CommerceOrderLine {
  return {
    billingPlan: "mensuel",
    categoryId: 2,
    categoryName: "EDR",
    productId: 7,
    productName: "Shield",
    quantity: 1,
    subtotal: 120,
    ...overrides,
  };
}

function order(overrides: Partial<CommerceOrder> = {}): CommerceOrder {
  return {
    customerId: "account-1",
    date: "2026-07-10T10:00:00Z",
    guestEmail: null,
    id: 1,
    lines: [line()],
    status: "Validée",
    total: 120,
    ...overrides,
  };
}

describe("commerce report ranges", () => {
  it("builds seven calendar days and an equal previous period", () => {
    const range = createReportRange("7d", { now: NOW });
    expect(range).toMatchObject({
      from: "2026-07-08",
      granularity: "day",
      previousFrom: "2026-07-01",
      previousTo: "2026-07-07",
      to: "2026-07-14",
    });
  });

  it("builds five Monday-based weekly buckets across the Paris DST switch", () => {
    const range = createReportRange("5w", { now: new Date("2026-04-02T12:00:00Z") });
    const data = aggregateCommerceReport({
      locale: "fr",
      orders: [],
      range,
      subscriptionHealth: subscriptionHealth(),
    });

    expect(range).toMatchObject({
      from: "2026-03-02",
      granularity: "week",
      to: "2026-04-02",
    });
    expect(range.fromIso).toBe("2026-03-01T23:00:00.000Z");
    expect(range.toExclusiveIso).toBe("2026-04-02T22:00:00.000Z");
    expect(data.trend).toHaveLength(5);
    expect(data.trend.map((point) => point.key)).toEqual([
      "2026-03-02",
      "2026-03-09",
      "2026-03-16",
      "2026-03-23",
      "2026-03-30",
    ]);
  });

  it("selects daily, weekly and monthly buckets for custom ranges", () => {
    expect(createReportRange("custom", { from: "2026-06-14", now: NOW, to: "2026-07-14" }).granularity).toBe("day");
    expect(createReportRange("custom", { from: "2026-06-13", now: NOW, to: "2026-07-14" }).granularity).toBe("week");
    expect(createReportRange("custom", { from: "2026-03-16", now: NOW, to: "2026-07-14" }).granularity).toBe("month");
  });

  it("uses Europe/Paris DST boundaries", () => {
    const range = createReportRange("custom", {
      from: "2026-03-29",
      now: NOW,
      to: "2026-03-29",
    });
    expect(range.fromIso).toBe("2026-03-28T23:00:00.000Z");
    expect(range.toExclusiveIso).toBe("2026-03-29T22:00:00.000Z");
  });

  it("returns distinct errors for missing, impossible, reversed, future and excessive ranges", () => {
    const today = "2026-07-14";
    expect(validateCustomReportRange(undefined, "2026-07-14", today)).toBe("INVALID_DATE_FORMAT");
    expect(validateCustomReportRange("2026-02-30", "2026-03-01", today)).toBe("INVALID_DATE_FORMAT");
    expect(validateCustomReportRange("2026-07-02", "2026-07-01", today)).toBe("RANGE_REVERSED");
    expect(validateCustomReportRange("2026-07-14", "2026-07-15", today)).toBe("RANGE_IN_FUTURE");
    expect(validateCustomReportRange("2025-01-01", "2026-01-02", today)).toBe("RANGE_TOO_LONG");
  });
});

describe("commerce aggregation", () => {
  const range = createReportRange("custom", {
    from: "2026-07-08",
    now: NOW,
    to: "2026-07-14",
  });

  it.each(["Validée", "validee", "payee", "paid", "completed", "active"])("recognizes completed legacy status %s", (status) => {
    expect(isCompletedOrderStatus(status)).toBe(true);
  });

  it("excludes pending and failed orders and keeps empty days", () => {
    const data = aggregateCommerceReport({
      generatedAt: NOW,
      locale: "fr",
      orders: [
        order(),
        order({
          customerId: null,
          guestEmail: "GUEST@example.com",
          id: 2,
          lines: [line({ categoryId: 3, categoryName: "XDR", productId: 9, productName: "Watch", subtotal: 80 })],
          total: 80,
        }),
        order({ id: 3, status: "En attente", total: 999 }),
        order({ id: 4, status: "Échouée", total: 999 }),
        order({ date: "2026-07-03T10:00:00Z", id: 5, total: 100 }),
      ],
      range,
      subscriptionHealth: subscriptionHealth(4, 1),
    });

    expect(data.current).toMatchObject({
      averageOrderValue: 100,
      grossRevenue: 200,
      orderCount: 2,
      uniqueCustomers: 2,
    });
    expect(data.previous.grossRevenue).toBe(100);
    expect(data.current.changes.grossRevenue).toBe(100);
    expect(data.trend).toHaveLength(7);
    expect(data.trend.filter((point) => point.orders === 0)).toHaveLength(6);
    expect(data.topProducts.map((item) => item.name)).toEqual(["Shield", "Watch"]);
    expect(data.subscriptions).toMatchObject({
      active: 4,
      scheduledCancellations: 1,
      scheduledEndingCount: 1,
      upcomingRenewalCount: 3,
    });
  });

  it("computes category averages from line revenue and distinct containing orders", () => {
    const data = aggregateCommerceReport({
      locale: "fr",
      orders: [
        order({
          id: 1,
          lines: [
            line({ productId: 1, subtotal: 40 }),
            line({ productId: 2, subtotal: 60 }),
            line({ categoryId: 3, categoryName: "XDR", productId: 3, subtotal: 30 }),
          ],
          total: 130,
        }),
        order({ id: 2, lines: [line({ productId: 4, subtotal: 50 })], total: 50 }),
      ],
      range,
      subscriptionHealth: subscriptionHealth(),
    });
    const edr = data.categories.find((category) => category.name === "EDR");
    const edrPoint = data.categoryAverages.points.find((point) => point.key === "2026-07-10")?.values[edr?.key ?? ""];
    const xdr = data.categories.find((category) => category.name === "XDR");

    expect(edr).toMatchObject({ averageOrderValue: 75, orderCount: 2, revenue: 150 });
    expect(edrPoint).toEqual({ averageOrderValue: 75, orderCount: 2, revenue: 150 });
    expect(xdr).toMatchObject({ averageOrderValue: 30, orderCount: 1, revenue: 30 });
  });

  it("groups categories after the top seven into Other without counting an order twice", () => {
    const categoryLines = Array.from({ length: 9 }, (_, index) => line({
      categoryId: index + 1,
      categoryName: `Category ${index + 1}`,
      productId: index + 1,
      subtotal: index < 7 ? 100 - index * 10 : index === 7 ? 10 : 5,
    }));
    const total = categoryLines.reduce((sum, item) => sum + item.subtotal, 0);
    const data = aggregateCommerceReport({
      locale: "en",
      orders: [order({ id: 11, lines: categoryLines, total })],
      range,
      subscriptionHealth: subscriptionHealth(),
    });
    const other = data.categories.find((category) => category.isOther);
    const otherPoint = data.categoryAverages.points.find((point) => point.key === "2026-07-10")?.values.other;

    expect(data.categories).toHaveLength(8);
    expect(new Set(data.categories.filter((category) => !category.isOther).map((category) => category.color)).size).toBe(7);
    expect(data.categories.filter((category) => !category.isOther).every((category) => /^#[0-9a-f]{6}$/.test(category.color))).toBe(true);
    expect(data.categories.filter((category) => !category.isOther).map((category) => category.color)).toEqual([
      "#312e81", "#5a3f9c", "#6e47a9", "#9758c4", "#ab60d1", "#d471ec", "#e879f9",
    ]);
    expect(other).toMatchObject({ averageOrderValue: 15, name: "Other", orderCount: 1, revenue: 15 });
    expect(otherPoint).toEqual({ averageOrderValue: 15, orderCount: 1, revenue: 15 });
    expect(data.categories.reduce((sum, category) => sum + category.revenue, 0)).toBe(total);
  });

  it("returns a valid empty report", () => {
    const data = aggregateCommerceReport({
      locale: "en",
      orders: [],
      range,
      subscriptionHealth: subscriptionHealth(),
    });
    expect(data.current.grossRevenue).toBe(0);
    expect(data.current.changes.grossRevenue).toBe(0);
    expect(data.trend).toHaveLength(7);
    expect(data.categoryAverages.points).toHaveLength(7);
    expect(data.topProducts).toEqual([]);
  });
});
