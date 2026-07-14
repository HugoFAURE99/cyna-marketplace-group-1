import { describe, expect, it } from "vitest";

import { getCheckoutPromotionOptions } from "@/lib/checkout/checkout-session";

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
