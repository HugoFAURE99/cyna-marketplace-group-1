export type AutomaticPromotion = {
  id: number;
  stripeCouponId: string | null;
  type: "fixe" | "pourcentage";
  value: number;
};

export type AutomaticPromotionRule = AutomaticPromotion & {
  categoryIds: number[];
  productIds: number[];
};

export type AutomaticPromotionPrice = {
  automaticPromotion: AutomaticPromotion | null;
  promotionalPriceCents: number;
};

export function calculatePromotionalPriceCents(
  originalPriceCents: number,
  promotion: AutomaticPromotion | null,
): number {
  const price = Math.max(0, Math.round(originalPriceCents));
  if (!promotion || !Number.isFinite(promotion.value) || promotion.value <= 0) {
    return price;
  }

  const discountCents =
    promotion.type === "pourcentage"
      ? Math.round(price * (Math.min(100, promotion.value) / 100))
      : Math.round(promotion.value * 100);

  return Math.max(0, price - discountCents);
}

export function resolveAutomaticPromotion(
  originalPriceCents: number,
  productId: number,
  categoryId: number,
  rules: AutomaticPromotionRule[],
): AutomaticPromotionPrice {
  const applicable = rules.filter((rule) => {
    const isGlobal = rule.productIds.length === 0 && rule.categoryIds.length === 0;
    return (
      isGlobal ||
      rule.productIds.includes(productId) ||
      rule.categoryIds.includes(categoryId)
    );
  });

  let selected: AutomaticPromotion | null = null;
  let promotionalPriceCents = Math.max(0, Math.round(originalPriceCents));

  for (const rule of applicable) {
    const candidate = calculatePromotionalPriceCents(originalPriceCents, rule);
    if (
      candidate < promotionalPriceCents ||
      (candidate === promotionalPriceCents &&
        candidate < originalPriceCents &&
        (selected === null || rule.id < selected.id))
    ) {
      selected = {
        id: rule.id,
        stripeCouponId: rule.stripeCouponId,
        type: rule.type,
        value: rule.value,
      };
      promotionalPriceCents = candidate;
    }
  }

  return { automaticPromotion: selected, promotionalPriceCents };
}

export function formatPromotionDiscount(
  promotion: AutomaticPromotion,
  locale: string,
): string {
  if (promotion.type === "pourcentage") {
    return `-${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(promotion.value)}%`;
  }

  return `-${new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(promotion.value)}`;
}
