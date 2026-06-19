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
  productId: number;
  tariffId: number;
  licenseUserCount: number;
  name: string;
  imageUrl: string | null;
  categoryName: string | null;
  tariffs: PublicProductTariff[];
  typeFacturation: string;
  unitPriceCents: number;
  lineTotalCents: number;
  isUnavailable: boolean;
};

export type CartView = {
  items: CartViewItem[];
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
    return { items: [], subtotalCents: 0, count: 0 };
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

    items.push({
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
      unitPriceCents: tariff.prix,
      lineTotalCents: tariff.prix * line.licenseUserCount,
      isUnavailable: product.quantite_produit <= 0,
    });
  }

  return {
    items,
    subtotalCents: items.reduce((total, item) => total + item.lineTotalCents, 0),
    count: items.length,
  };
}
