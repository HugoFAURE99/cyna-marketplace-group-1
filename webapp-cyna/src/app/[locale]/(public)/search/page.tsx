// Centralized search + browse page. Reads all state from the URL (query,
// filters, and pagination), renders the filtered list, and shows
// priority-ordered catalog suggestions beneath so the page is never empty.
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductCard from "@/components/product/ProductCard";
import SearchFilters from "@/components/search/SearchFilters";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import {
  getCatalogCategories,
  getCatalogProducts,
  getCatalogTechnicalCharacteristics,
} from "@/lib/products/public-catalog";
import { searchCatalog } from "@/lib/products/search-products";

// Results depend on the query string, so never cache.
export const dynamic = "force-dynamic";

const SUGGESTION_COUNT = 4;
const RESULTS_PER_PAGE = 9;

type SearchParams = {
  q?: string | string[];
  category?: string | string[];
  tech?: string | string[];
  min?: string | string[];
  max?: string | string[];
  instock?: string | string[];
  page?: string | string[];
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
  const characteristicIds = parseIdList(first(raw.tech));
  const minPrice = parsePrice(first(raw.min));
  const maxPrice = parsePrice(first(raw.max));
  const inStockOnly = first(raw.instock) === "1";
  const requestedPage = parsePositiveInt(first(raw.page)) ?? 1;

  const t = await getTranslations("search");

  const [results, categories, technicalCharacteristics, suggestionProducts] =
    await Promise.all([
      searchCatalog(
        {
          query,
          categoryId,
          characteristicIds,
          minPrice,
          maxPrice,
          inStockOnly,
        },
        locale,
      ),
      getCatalogCategories(locale),
      getCatalogTechnicalCharacteristics(locale),
      getCatalogProducts(locale),
    ]);

  const totalPages = Math.max(1, Math.ceil(results.length / RESULTS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * RESULTS_PER_PAGE;
  const paginatedResults = results.slice(
    pageStart,
    pageStart + RESULTS_PER_PAGE,
  );
  const hrefForPage = (page: number) =>
    buildSearchHref({
      query,
      categoryId,
      characteristicIds,
      minPrice,
      maxPrice,
      inStockOnly,
      page,
    });

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
              characteristicIds={characteristicIds}
              inStockOnly={inStockOnly}
              maxPrice={maxPrice}
              minPrice={minPrice}
              technicalCharacteristics={technicalCharacteristics}
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
                <>
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {paginatedResults.map((product) => (
                      <ProductCard key={product.id_produit} product={product} />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <SearchPagination
                      currentPage={currentPage}
                      currentPageLabel={(page) => t("currentPage", { page })}
                      goToPageLabel={(page) => t("goToPage", { page })}
                      hrefForPage={hrefForPage}
                      label={t("pagination")}
                      nextLabel={t("nextPage")}
                      previousLabel={t("previousPage")}
                      totalPages={totalPages}
                    />
                  )}
                </>
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

function parseIdList(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0),
    ),
  ];
}

function parsePrice(value: string) {
  const parsed = Number(value);
  return value !== "" && Number.isFinite(parsed) && parsed >= 0
    ? parsed
    : undefined;
}

type SearchHrefOptions = {
  query: string;
  categoryId?: number;
  characteristicIds: number[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
  page: number;
};

function buildSearchHref({
  query,
  categoryId,
  characteristicIds,
  minPrice,
  maxPrice,
  inStockOnly,
  page,
}: SearchHrefOptions) {
  const params = new URLSearchParams();
  if (query) {
    params.set("q", query);
  }
  if (categoryId !== undefined) {
    params.set("category", String(categoryId));
  }
  if (characteristicIds.length > 0) {
    params.set("tech", characteristicIds.join(","));
  }
  if (minPrice !== undefined) {
    params.set("min", String(minPrice));
  }
  if (maxPrice !== undefined) {
    params.set("max", String(maxPrice));
  }
  if (inStockOnly) {
    params.set("instock", "1");
  }
  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : "/search";
}

type SearchPaginationProps = {
  currentPage: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
  label: string;
  previousLabel: string;
  nextLabel: string;
  goToPageLabel: (page: number) => string;
  currentPageLabel: (page: number) => string;
};

function SearchPagination({
  currentPage,
  totalPages,
  hrefForPage,
  label,
  previousLabel,
  nextLabel,
  goToPageLabel,
  currentPageLabel,
}: SearchPaginationProps) {
  const items = getPaginationItems(currentPage, totalPages);
  const linkClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-xs transition hover:border-purple-300 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700";
  const disabledClass =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-slate-100 bg-slate-50 px-3 text-sm font-medium text-slate-300";

  return (
    <nav
      aria-label={label}
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {currentPage > 1 ? (
        <Link className={linkClass} href={hrefForPage(currentPage - 1)}>
          {previousLabel}
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          {previousLabel}
        </span>
      )}

      {items.map((item) =>
        typeof item === "number" ? (
          item === currentPage ? (
            <span
              aria-current="page"
              aria-label={currentPageLabel(item)}
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-purple-700 px-3 text-sm font-semibold text-white shadow-xs"
              key={item}
            >
              {item}
            </span>
          ) : (
            <Link
              aria-label={goToPageLabel(item)}
              className={linkClass}
              href={hrefForPage(item)}
              key={item}
            >
              {item}
            </Link>
          )
        ) : (
          <span
            aria-hidden="true"
            className="inline-flex h-9 min-w-9 items-center justify-center text-sm font-medium text-slate-400"
            key={item}
          >
            ...
          </span>
        ),
      )}

      {currentPage < totalPages ? (
        <Link className={linkClass} href={hrefForPage(currentPage + 1)}>
          {nextLabel}
        </Link>
      ) : (
        <span aria-disabled="true" className={disabledClass}>
          {nextLabel}
        </span>
      )}
    </nav>
  );
}

function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set(
    [1, totalPages, currentPage - 1, currentPage, currentPage + 1].filter(
      (page) => page >= 1 && page <= totalPages,
    ),
  );
  const sortedPages = [...pages].sort((a, b) => a - b);
  const items: (number | string)[] = [];

  for (const page of sortedPages) {
    const previous = items.at(-1);
    if (typeof previous === "number" && page - previous > 1) {
      items.push(`ellipsis-${previous}-${page}`);
    }
    items.push(page);
  }

  return items;
}
