// Server-only catalog search + filtering. Fuzzy matching (typo-tolerant)
// decides WHICH products are relevant; the matched set is then re-sorted
// strictly by the public search order, never by relevance score.
import "server-only";

import Fuse, { type IFuseOptions } from "fuse.js";

import type { Locale } from "@/lib/i18n/translations";
import {
  compareBySearchOrder,
  getCatalogProducts,
  type CatalogProduct,
} from "@/lib/products/public-catalog";

// Minimum characters before we bother running a fuzzy search.
export const MIN_QUERY_LENGTH = 2;

export type CatalogFilters = {
  query?: string;
  categoryId?: number;
  characteristicIds?: number[];
  // Price bounds in euros (UI unit); products store cents.
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
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
    categoryId,
    characteristicIds = [],
    minPrice,
    maxPrice,
    inStockOnly,
  } = filters;

  let products = await getCatalogProducts(locale, categoryId);

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
    products = products.filter((product) => product.quantite_produit > 0);
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

  return products;
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
  quantite_produit: number;
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
    quantite_produit: product.quantite_produit,
  };
}
