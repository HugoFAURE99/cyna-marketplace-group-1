import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import PromotionalPrice from "@/components/product/PromotionalPrice";

describe("PromotionalPrice", () => {
  it("renders the original price, promotional price, and promo badge", () => {
    const markup = renderToStaticMarkup(
      <PromotionalPrice
        automaticPromotion={{
          id: 7,
          stripeCouponId: "coupon_7",
          type: "pourcentage",
          value: 20,
        }}
        badgeLabel={(discount) => `Promo ${discount}`}
        locale="fr"
        originalPriceCents={12_500}
        periodSuffix="/mois"
        promotionalPriceCents={10_000}
      />,
    );

    expect(markup).toContain("<del");
    expect(markup).toContain("125");
    expect(markup).toContain("100");
    expect(markup).toContain("Promo -20%");
  });

  it("does not render promotion chrome without an effective discount", () => {
    const markup = renderToStaticMarkup(
      <PromotionalPrice
        automaticPromotion={null}
        badgeLabel={(discount) => `Promo ${discount}`}
        locale="en"
        originalPriceCents={5_000}
        promotionalPriceCents={5_000}
      />,
    );

    expect(markup).not.toContain("<del");
    expect(markup).not.toContain("Promo");
  });
});
