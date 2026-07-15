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

export function getLinePromotionId(
  itemPromotion: AutomaticPromotion | null,
  checkoutPromotion: AutomaticPromotion | null,
): number | null {
  if (!checkoutPromotion || itemPromotion?.id !== checkoutPromotion.id) {
    return null;
  }

  return checkoutPromotion.id;
}
