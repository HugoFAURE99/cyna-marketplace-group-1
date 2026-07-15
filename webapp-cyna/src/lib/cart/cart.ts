// Server-only cart access. The cart lives in an HTTP cookie so the server can
// read it during render (header badge + cart page) without any client store.
// Writes happen in `cart.actions.ts` (cookies can only be set in a Server
// Action / Route Handler); the parse/serialize helpers are shared with it.
import "server-only";

import { cookies } from "next/headers";

import { MAX_LICENSE_USERS, MIN_LICENSE_USERS } from "@/lib/cart/cart-constants";
import { type Locale } from "@/lib/i18n/translations";
import {
  getCatalogProductsByIds,
  type CatalogProduct,
} from "@/lib/products/public-catalog";
import type { PublicProductTariff } from "@/lib/products/public-products";
import {
  calculatePromotionalPriceCents,
  type AutomaticPromotion,
} from "@/lib/promotions/automatic-promotion";

export const CART_COOKIE = "cyna_cart";
// ~30 days, in seconds.
export const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

// One cart line, keyed by product + tariff (a product can be in the cart under
// more than one billing period). The cookie still stores this as `q`, but it
// represents users covered by one license.
export type CartLine = {
  productId: number;
  tariffId: number;
  licenseUserCount: number;
};

// A cart line enriched with the product data needed to render it.
export type CartViewItem = {
  automaticPromotion: AutomaticPromotion | null;
  productId: number;
  tariffId: number;
  licenseUserCount: number;
  name: string;
  imageUrl: string | null;
  categoryName: string | null;
  tariffs: PublicProductTariff[];
  typeFacturation: string;
  unitPriceCents: number;
  originalUnitPriceCents: number;
  lineTotalCents: number;
  originalLineTotalCents: number;
  isUnavailable: boolean;
  stripePriceId: string;
};

export type CartView = {
  automaticPromotion: AutomaticPromotion | null;
  items: CartViewItem[];
  originalSubtotalCents: number;
  subtotalCents: number;
  count: number;
};

export function clampLicenseUserCount(value: number) {
  if (!Number.isFinite(value)) {
    return MIN_LICENSE_USERS;
  }
  return Math.min(
    MAX_LICENSE_USERS,
    Math.max(MIN_LICENSE_USERS, Math.trunc(value)),
  );
}

// Parse + harden the cookie value: tolerate malformed JSON, drop invalid
// entries, clamp user counts, and merge duplicate product+tariff lines.
export function parseCart(raw: string | undefined): CartLine[] {
  if (!raw) {
    return [];
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  const byKey = new Map<string, CartLine>();
  for (const entry of data) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const { p, t, q } = entry as Record<string, unknown>;
    if (
      !Number.isInteger(p) ||
      !Number.isInteger(t) ||
      (p as number) <= 0 ||
      (t as number) <= 0
    ) {
      continue;
    }
    const productId = p as number;
    const tariffId = t as number;
    const licenseUserCount = clampLicenseUserCount(Number(q));
    const key = `${productId}:${tariffId}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.licenseUserCount = clampLicenseUserCount(
        existing.licenseUserCount + licenseUserCount,
      );
    } else {
      byKey.set(key, { productId, tariffId, licenseUserCount });
    }
  }

  return [...byKey.values()];
}

// Compact JSON (`{ p, t, q }`) to keep the cookie small.
export function serializeCart(lines: CartLine[]): string {
  return JSON.stringify(
    lines.map((line) => ({
      p: line.productId,
      t: line.tariffId,
      q: line.licenseUserCount,
    })),
  );
}

export async function readCart(): Promise<CartLine[]> {
  const store = await cookies();
  return parseCart(store.get(CART_COOKIE)?.value);
}

// Total number of license lines; drives the header badge.
export async function getCartCount(): Promise<number> {
  const lines = await readCart();
  return lines.length;
}

// Enrich the cookie lines with product data for the cart page. Self-healing:
// lines whose product is gone/inactive, or whose tariff no longer exists, are
// dropped from the view (they linger in the cookie until the next write).
export async function getCartView(locale: Locale): Promise<CartView> {
  const lines = await readCart();
  if (lines.length === 0) {
    return {
      automaticPromotion: null,
      items: [],
      originalSubtotalCents: 0,
      subtotalCents: 0,
      count: 0,
    };
  }

  const productIds = [...new Set(lines.map((line) => line.productId))];
  const products = await getCatalogProductsByIds(productIds, locale);
  const byId = new Map<number, CatalogProduct>(
    products.map((product) => [product.id_produit, product]),
  );

  const items: CartViewItem[] = [];
  for (const line of lines) {
    const product = byId.get(line.productId);
    if (!product) {
      continue;
    }
    const tariff = product.tariffs.find(
      (entry) => entry.id_prix === line.tariffId,
    );
    if (!tariff) {
      continue;
    }

    const originalLineTotalCents = tariff.prix * line.licenseUserCount;
    items.push({
      automaticPromotion: tariff.automaticPromotion,
      productId: product.id_produit,
      tariffId: tariff.id_prix,
      licenseUserCount: line.licenseUserCount,
      name: product.nom_pro,
      imageUrl:
        product.images[0]?.lien_image_produit ??
        product.category?.lien_image_cat ??
        null,
      categoryName: product.category?.cat_nom ?? null,
      tariffs: product.tariffs,
      typeFacturation: tariff.type_facturation,
      unitPriceCents: tariff.promotionalPriceCents,
      originalUnitPriceCents: tariff.prix,
      lineTotalCents: calculatePromotionalPriceCents(
        originalLineTotalCents,
        tariff.automaticPromotion,
      ),
      originalLineTotalCents,
      isUnavailable: !product.est_disponible,
      stripePriceId: tariff.stripe_price_id,
    });
  }

  const { promotion, items: checkoutItems } = selectCartPromotion(items);
  return {
    automaticPromotion: promotion,
    items: checkoutItems,
    originalSubtotalCents: checkoutItems.reduce(
      (total, item) => total + item.originalLineTotalCents,
      0,
    ),
    subtotalCents: checkoutItems.reduce(
      (total, item) => total + item.lineTotalCents,
      0,
    ),
    count: checkoutItems.length,
  };
}

function selectCartPromotion(items: CartViewItem[]): {
  items: CartViewItem[];
  promotion: AutomaticPromotion | null;
} {
  const groups = new Map<
    number,
    { promotion: AutomaticPromotion; itemIndexes: number[]; originalTotal: number }
  >();

  items.forEach((item, index) => {
    const promotion = item.automaticPromotion;
    if (!promotion?.stripeCouponId) return;
    const group = groups.get(promotion.id) ?? {
      promotion,
      itemIndexes: [],
      originalTotal: 0,
    };
    group.itemIndexes.push(index);
    group.originalTotal += item.originalLineTotalCents;
    groups.set(promotion.id, group);
  });

  const winner = [...groups.values()].sort((a, b) => {
    const aSaving =
      a.originalTotal -
      calculatePromotionalPriceCents(a.originalTotal, a.promotion);
    const bSaving =
      b.originalTotal -
      calculatePromotionalPriceCents(b.originalTotal, b.promotion);
    return bSaving - aSaving || a.promotion.id - b.promotion.id;
  })[0];

  if (!winner) {
    return {
      promotion: null,
      items: items.map((item) => ({
        ...item,
        automaticPromotion: null,
        unitPriceCents: item.originalUnitPriceCents,
        lineTotalCents: item.originalLineTotalCents,
      })),
    };
  }

  const winningIndexes = new Set(winner.itemIndexes);
  const promotedTotal = calculatePromotionalPriceCents(
    winner.originalTotal,
    winner.promotion,
  );
  const totalDiscount = winner.originalTotal - promotedTotal;
  let allocatedDiscount = 0;

  const selectedItems = items.map((item, index) => {
    if (!winningIndexes.has(index)) {
      return {
        ...item,
        automaticPromotion: null,
        unitPriceCents: item.originalUnitPriceCents,
        lineTotalCents: item.originalLineTotalCents,
      };
    }

    const isLast = index === winner.itemIndexes.at(-1);
    const discount = isLast
      ? totalDiscount - allocatedDiscount
      : Math.floor(
          totalDiscount *
            (item.originalLineTotalCents / winner.originalTotal),
        );
    allocatedDiscount += discount;
    return {
      ...item,
      automaticPromotion: winner.promotion,
      unitPriceCents: Math.max(
        0,
        Math.round(
          (item.originalLineTotalCents - discount) / item.licenseUserCount,
        ),
      ),
      lineTotalCents: item.originalLineTotalCents - discount,
    };
  });

  return { items: selectedItems, promotion: winner.promotion };
}
