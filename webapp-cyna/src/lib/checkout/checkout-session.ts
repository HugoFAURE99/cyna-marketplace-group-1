import type Stripe from "stripe";

import type { AutomaticPromotion } from "@/lib/promotions/automatic-promotion";

type CheckoutPromotionOptions = Pick<
  Stripe.Checkout.SessionCreateParams,
  "allow_promotion_codes" | "discounts"
>;

export function getCheckoutPromotionOptions(
  promotion: AutomaticPromotion | null,
): CheckoutPromotionOptions {
  if (promotion?.stripeCouponId) {
    return { discounts: [{ coupon: promotion.stripeCouponId }] };
  }

  return { allow_promotion_codes: true };
}
