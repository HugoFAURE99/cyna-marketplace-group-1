import { describe, expect, it } from "vitest";

import {
  getCheckoutPromotionOptions,
  getLinePromotionId,
} from "@/lib/checkout/checkout-session";

describe("getCheckoutPromotionOptions", () => {
  it("uses an automatic coupon without also sending allow_promotion_codes", () => {
    expect(
      getCheckoutPromotionOptions({
        id: 6,
        stripeCouponId: "coupon_automatic",
        type: "pourcentage",
        value: 100,
      }),
    ).toEqual({ discounts: [{ coupon: "coupon_automatic" }] });
  });

  it("allows customer-entered promotion codes when no automatic coupon applies", () => {
    expect(getCheckoutPromotionOptions(null)).toEqual({
      allow_promotion_codes: true,
    });
  });
});

describe("getLinePromotionId", () => {
  const automaticPromotion = {
    id: 6,
    stripeCouponId: "coupon_automatic",
    type: "pourcentage" as const,
    value: 20,
  };

  it("returns null when the cart has no automatic promotion", () => {
    expect(getLinePromotionId(null, null)).toBeNull();
  });

  it("returns the promotion id when the line uses the checkout promotion", () => {
    expect(getLinePromotionId(automaticPromotion, automaticPromotion)).toBe(6);
  });

  it("returns null when the line does not use the checkout promotion", () => {
    expect(getLinePromotionId(null, automaticPromotion)).toBeNull();
    expect(
      getLinePromotionId(
        { ...automaticPromotion, id: 7 },
        automaticPromotion,
      ),
    ).toBeNull();
  });
});
