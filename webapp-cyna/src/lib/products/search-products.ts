// Server-only catalog search + filtering. Fuzzy matching (typo-tolerant)
// decides WHICH products are relevant; the matched set is then re-sorted
// strictly by the public search order, never by relevance score.
import "server-only";

import Fuse, { type IFuseOptions } from "fuse.js";

import type { Locale } from "@/lib/i18n/translations";
import type { SortKey } from "@/lib/products/catalog-sort";
import {
  compareBySearchOrder,
  getCatalogProducts,
  type CatalogProduct,
} from "@/lib/products/public-catalog";

// Minimum characters before we bother running a fuzzy search.
export const MIN_QUERY_LENGTH = 2;

export type CatalogFilters = {
  query?: string;
  categoryIds?: number[];
  characteristicIds?: number[];
  // Price bounds in euros (UI unit); products store cents.
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: SortKey;
};

const FUSE_OPTIONS: IFuseOptions<CatalogProduct> = {
  // Typo tolerance: 0 = exact, 1 = match anything. 0.4 is a forgiving middle.
  threshold: 0.4,
  // Match anywhere in the field, not just near the start.
  ignoreLocation: true,
  minMatchCharLength: MIN_QUERY_LENGTH,
  keys: [
    { name: "nom_pro", weight: 0.7 },
    { name: "category.cat_nom", weight: 0.2 },
    { name: "description", weight: 0.1 },
  ],
};

const toCents = (euros?: number) =>
  euros === undefined || Number.isNaN(euros) ? undefined : Math.round(euros * 100);

// Apply the fuzzy query (if any), then the structured filters. Category is
// filtered in SQL; price/availability in memory (price lives in the tariff
// array, so it can't be a simple column filter).
export async function searchCatalog(
  filters: CatalogFilters,
  locale: Locale,
): Promise<CatalogProduct[]> {
  const {
    query,
    categoryIds = [],
    characteristicIds = [],
    minPrice,
    maxPrice,
    inStockOnly,
    sort = "relevance",
  } = filters;

  let products = await getCatalogProducts(locale, categoryIds);

  const trimmed = (query ?? "").trim();
  if (trimmed.length >= MIN_QUERY_LENGTH) {
    const fuse = new Fuse(products, FUSE_OPTIONS);
    products = fuse
      .search(trimmed)
      .map((result) => result.item)
      .sort(compareBySearchOrder);
  }

  const minCents = toCents(minPrice);
  const maxCents = toCents(maxPrice);
  if (minCents !== undefined || maxCents !== undefined) {
    products = products.filter((product) => {
      const price = product.tariffs[0]?.prix;
      if (price === undefined) {
        return false;
      }
      if (minCents !== undefined && price < minCents) {
        return false;
      }
      if (maxCents !== undefined && price > maxCents) {
        return false;
      }
      return true;
    });
  }

  if (inStockOnly) {
    products = products.filter((product) => product.est_disponible);
  }

  const selectedCharacteristicIds = [
    ...new Set(
      characteristicIds.filter(
        (id) => Number.isInteger(id) && id > 0,
      ),
    ),
  ];
  if (selectedCharacteristicIds.length > 0) {
    products = products.filter((product) => {
      const productCharacteristicIds = new Set(
        product.technicalCharacteristics.map(
          (characteristic) => characteristic.id_caracteristique,
        ),
      );

      return selectedCharacteristicIds.every((id) =>
        productCharacteristicIds.has(id),
      );
    });
  }

  return sortCatalog(products, sort, locale);
}

// Re-sort the filtered set. "relevance" is a no-op (the list already carries the
// public search order). Products without a price sink to the bottom of price
// sorts so the meaningful results stay on top.
function sortCatalog(
  products: CatalogProduct[],
  sort: SortKey,
  locale: Locale,
): CatalogProduct[] {
  if (sort === "relevance") {
    return products;
  }

  const priceOf = (product: CatalogProduct) => product.tariffs[0]?.prix ?? null;

  return [...products].sort((a, b) => {
    switch (sort) {
      case "price-asc":
      case "price-desc": {
        const pa = priceOf(a);
        const pb = priceOf(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return sort === "price-asc" ? pa - pb : pb - pa;
      }
      case "name-asc":
        return a.nom_pro.localeCompare(b.nom_pro, locale);
      case "newest":
        return (
          b.date_ajout.localeCompare(a.date_ajout) || a.id_produit - b.id_produit
        );
      case "oldest":
        return (
          a.date_ajout.localeCompare(b.date_ajout) || a.id_produit - b.id_produit
        );
      case "availability":
        // Available (in-stock) products first, then fall back to search order.
        return (
          Number(b.est_disponible) - Number(a.est_disponible) ||
          compareBySearchOrder(a, b)
        );
      default:
        return 0;
    }
  });
}

// Slim shape sent to the header live-search dropdown (keeps the JSON payload
// small and decoupled from the full CatalogProduct).
export type SearchSuggestion = {
  id_produit: number;
  nom_pro: string;
  cat_nom: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  type_facturation: string | null;
  est_disponible: boolean;
};

export function toSuggestion(product: CatalogProduct): SearchSuggestion {
  return {
    id_produit: product.id_produit,
    nom_pro: product.nom_pro,
    cat_nom: product.category?.cat_nom ?? null,
    imageUrl:
      product.images[0]?.lien_image_produit ??
      product.category?.lien_image_cat ??
      null,
    priceCents: product.tariffs[0]?.prix ?? null,
    type_facturation: product.tariffs[0]?.type_facturation ?? null,
    est_disponible: product.est_disponible,
  };
}
