import { describe, expect, it } from "vitest";

import {
  calculatePromotionalPriceCents,
  resolveAutomaticPromotion,
  type AutomaticPromotionRule,
} from "@/lib/promotions/automatic-promotion";

function rule(
  overrides: Partial<AutomaticPromotionRule> = {},
): AutomaticPromotionRule {
  return {
    id: 1,
    stripeCouponId: "coupon_1",
    type: "pourcentage",
    value: 20,
    categoryIds: [],
    productIds: [],
    ...overrides,
  };
}

describe("automatic promotions", () => {
  it("calculates percentage and fixed promotional prices safely", () => {
    expect(calculatePromotionalPriceCents(10_000, rule())).toBe(8_000);
    expect(
      calculatePromotionalPriceCents(10_000, rule({ type: "fixe", value: 15 })),
    ).toBe(8_500);
    expect(
      calculatePromotionalPriceCents(1_000, rule({ type: "fixe", value: 50 })),
    ).toBe(0);
  });

  it("supports global, category, and product targeting", () => {
    const rules = [
      rule({ id: 3, value: 5 }),
      rule({ id: 2, value: 15, categoryIds: [4] }),
      rule({ id: 1, value: 30, productIds: [12] }),
    ];

    expect(resolveAutomaticPromotion(10_000, 12, 4, rules)).toMatchObject({
      promotionalPriceCents: 7_000,
      automaticPromotion: { id: 1 },
    });
    expect(resolveAutomaticPromotion(10_000, 13, 4, rules)).toMatchObject({
      promotionalPriceCents: 8_500,
      automaticPromotion: { id: 2 },
    });
    expect(resolveAutomaticPromotion(10_000, 13, 5, rules)).toMatchObject({
      promotionalPriceCents: 9_500,
      automaticPromotion: { id: 3 },
    });
  });

  it("chooses the strongest discount and resolves equal discounts by id", () => {
    expect(
      resolveAutomaticPromotion(10_000, 1, 1, [
        rule({ id: 9, value: 20 }),
        rule({ id: 4, type: "fixe", value: 20 }),
      ]).automaticPromotion?.id,
    ).toBe(4);
  });

  it("does not expose zero-value promotions", () => {
    expect(
      resolveAutomaticPromotion(10_000, 1, 1, [rule({ value: 0 })]),
    ).toEqual({ automaticPromotion: null, promotionalPriceCents: 10_000 });
  });
});
