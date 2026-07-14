import { describe, expect, it } from "vitest";

import { aggregateSubscriptionHealth, isActiveSubscriptionStatus, type SubscriptionHealthSource } from "@/lib/admin/subscription-health";

function subscription(overrides: Partial<SubscriptionHealthSource> = {}): SubscriptionHealthSource {
  return {
    billingPlan: "mensuel",
    contactEmail: "client@example.com",
    customerName: "CYNA Client",
    endDate: "2026-08-10T10:00:00Z",
    id: 1,
    orderId: 101,
    priceCents: 2500,
    productId: 7,
    productName: "Shield",
    scheduledCancellation: false,
    seats: 2,
    status: "active",
    ...overrides,
  };
}

describe("subscription health aggregation", () => {
  it.each(["active", "Actif", "trialing"])("recognizes active status %s", (status) => {
    expect(isActiveSubscriptionStatus(status)).toBe(true);
  });

  it("separates renewals from scheduled endings and aggregates values", () => {
    const data = aggregateSubscriptionHealth({
      generatedAt: new Date("2026-07-14T10:00:00Z"),
      horizon: 30,
      subscriptions: [
        subscription(),
        subscription({ id: 2, scheduledCancellation: true, priceCents: 1000, seats: 3 }),
        subscription({ id: 3, status: "cancelled" }),
        subscription({ endDate: null, id: 4 }),
      ],
    });
    expect(data).toMatchObject({
      active: 3,
      activeSeats: 7,
      upcomingRenewalCount: 1,
      upcomingRenewalValue: 50,
      scheduledEndingCount: 1,
      scheduledEndingValue: 30,
    });
    expect(data.upcomingRenewals[0]).toMatchObject({ contactEmail: "client@example.com", daysRemaining: 27 });
    expect(data.productBreakdown[0]).toMatchObject({ count: 3, seats: 7, value: 130 });
  });

  it.each([7, 30, 60, 90] as const)("uses the %d-day Europe/Paris horizon", (horizon) => {
    const data = aggregateSubscriptionHealth({
      generatedAt: new Date("2026-03-28T23:30:00Z"),
      horizon,
      subscriptions: [
        subscription({ endDate: `2026-03-${String(29 + Math.min(horizon, 2)).padStart(2, "0")}T10:00:00Z` }),
      ],
    });
    expect(data.asOf).toBe("2026-03-29");
    expect(data.horizon).toBe(horizon);
    expect(data.upcomingRenewalCount).toBe(1);
  });

  it("excludes past, out-of-horizon, inactive, and undated rows", () => {
    const data = aggregateSubscriptionHealth({
      generatedAt: new Date("2026-07-14T10:00:00Z"),
      horizon: 7,
      subscriptions: [
        subscription({ endDate: "2026-07-13T10:00:00Z" }),
        subscription({ endDate: "2026-07-22T10:00:00Z", id: 2 }),
        subscription({ endDate: "2026-07-18T10:00:00Z", id: 3, status: "cancelled" }),
        subscription({ endDate: null, id: 4 }),
      ],
    });
    expect(data.upcomingRenewals).toEqual([]);
    expect(data.scheduledEndings).toEqual([]);
  });

  it("returns valid empty breakdowns", () => {
    const data = aggregateSubscriptionHealth({ generatedAt: new Date("2026-07-14T10:00:00Z"), horizon: 90, subscriptions: [] });
    expect(data).toMatchObject({ active: 0, activeSeats: 0, upcomingRenewalCount: 0, scheduledEndingCount: 0 });
    expect(data.billingBreakdown).toEqual([]);
    expect(data.productBreakdown).toEqual([]);
  });
});
