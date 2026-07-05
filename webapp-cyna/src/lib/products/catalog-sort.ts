// Catalog sort options shared by the search page (server component) and the
// SortSelect control (client component). Kept free of "server-only" so it can
// be safely bundled on the client.

// "relevance" keeps the public search order (fuzzy match order for a query,
// priority order otherwise); the rest re-sort the already-filtered set.
export const SORT_KEYS = [
  "relevance",
  "price-asc",
  "price-desc",
  "newest",
  "oldest",
  "availability",
  "name-asc",
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export function parseSortKey(value?: string | null): SortKey {
  return (SORT_KEYS as readonly string[]).includes(value ?? "")
    ? (value as SortKey)
    : "relevance";
}
