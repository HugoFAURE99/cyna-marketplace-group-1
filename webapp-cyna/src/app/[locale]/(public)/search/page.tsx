// Centralized search + browse page. Reads all state from the URL (query +
// filters), renders the filtered list, and shows priority-ordered catalog
// suggestions beneath so the page is never empty.
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductCard from "@/components/product/ProductCard";
import SearchFilters from "@/components/search/SearchFilters";
import type { Locale } from "@/lib/i18n/translations";
import {
  getCatalogCategories,
  getCatalogProducts,
} from "@/lib/products/public-catalog";
import { searchCatalog } from "@/lib/products/search-products";

// Results depend on the query string, so never cache.
export const dynamic = "force-dynamic";

const SUGGESTION_COUNT = 4;

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  min?: string | string[];
  max?: string | string[];
  instock?: string | string[];
};

type SearchPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({
  params,
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = first(q).trim();
  const t = await getTranslations({ locale, namespace: "search" });

  return {
    title: query ? `${t("resultsFor", { query })} | CYNA` : `${t("title")} | CYNA`,
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const raw = await searchParams;
  const query = first(raw.q).trim();
  const categoryId = parsePositiveInt(first(raw.category));
  const minPrice = parsePrice(first(raw.min));
  const maxPrice = parsePrice(first(raw.max));
  const inStockOnly = first(raw.instock) === "1";

  const t = await getTranslations("search");

  const [results, categories, suggestionProducts] = await Promise.all([
    searchCatalog({ query, categoryId, minPrice, maxPrice, inStockOnly }, locale),
    getCatalogCategories(locale),
    getCatalogProducts(locale),
  ]);

  // Suggestions use the public search order, minus whatever is already shown,
  // so the page is never empty when a search/filter returns nothing.
  const shownIds = new Set(results.map((product) => product.id_produit));
  const suggestions = suggestionProducts
    .filter((product) => !shownIds.has(product.id_produit))
    .slice(0, SUGGESTION_COUNT);

  const hasQuery = query.length > 0;

  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-[156px] lg:self-start">
            <SearchFilters
              categories={categories}
              categoryId={categoryId}
              inStockOnly={inStockOnly}
              maxPrice={maxPrice}
              minPrice={minPrice}
            />
          </aside>

          <div className="space-y-8">
            <header className="space-y-1">
              <h1 className="text-2xl font-bold text-slate-950">
                {hasQuery ? t("resultsFor", { query }) : t("browseTitle")}
              </h1>
              <p className="text-sm text-slate-600">
                {t("resultCount", { count: results.length })}
              </p>
            </header>

            <div className="space-y-12">
              {results.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map((product) => (
                    <ProductCard key={product.id_produit} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-base font-medium text-slate-900">
                    {t("noResults")}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("noResultsHint")}
                  </p>
                </div>
              )}

              {suggestions.length > 0 && (
                <section
                  aria-labelledby="search-suggestions"
                  className="space-y-5"
                >
                  <h2
                    className="text-xl font-bold text-slate-950"
                    id="search-suggestions"
                  >
                    {t("suggestions")}
                  </h2>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {suggestions.map((product) => (
                      <ProductCard key={product.id_produit} product={product} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function first(value?: string | string[]) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parsePositiveInt(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parsePrice(value: string) {
  const parsed = Number(value);
  return value !== "" && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : undefined;
}
