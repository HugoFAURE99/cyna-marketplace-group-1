// JSON search endpoint for the header live-search dropdown. Reuses the same
// fuzzy search as the search page; returns a slim list of suggestions.
import { hasLocale } from "next-intl";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/i18n/translations";
import {
  MIN_QUERY_LENGTH,
  searchCatalog,
  toSuggestion,
} from "@/lib/products/search-products";

const MAX_RESULTS = 6;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const query = (params.get("q") ?? "").trim();
  const localeParam = params.get("locale") ?? routing.defaultLocale;
  const locale: Locale = hasLocale(routing.locales, localeParam)
    ? localeParam
    : routing.defaultLocale;

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json({ results: [] });
  }

  const matches = await searchCatalog({ query }, locale);
  const results = matches.slice(0, MAX_RESULTS).map(toSuggestion);

  return NextResponse.json({ results });
}
