"use client";

// Header search box with a live, debounced results dropdown. Typing queries the
// /api/search endpoint; results link straight to products, and "see all" (or
// submitting the form) opens the full search page. Degrades to a plain GET form
// when JS is disabled.
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { ImageOff, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";
import { formatPriceCents } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/translations";
import type { SearchSuggestion } from "@/lib/products/search-products";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

export default function SearchAutocomplete({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const t = useTranslations("header");
  const tp = useTranslations("product");
  const ts = useTranslations("search");
  const locale = useLocale() as Locale;
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH;
  const showDropdown = open && canSearch;

  // Debounced fetch against the JSON endpoint; aborts stale requests.
  useEffect(() => {
    if (!canSearch) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&locale=${locale}`,
          { signal: controller.signal },
        );
        if (!response.ok) {
          throw new Error("search request failed");
        }
        const data = (await response.json()) as { results: SearchSuggestion[] };
        setResults(data.results);
        setActiveIndex(-1);
        setOpen(true);
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [trimmed, canSearch, locale]);

  // Close when clicking outside the widget.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const goToSearch = (value: string) => {
    const q = value.trim();
    if (q.length === 0) {
      return;
    }
    setOpen(false);
    onNavigate?.();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const periodSuffix = (type: string | null) => {
    if (type === "mensuel") return tp("perMonth");
    if (type === "annuel") return tp("perYear");
    return "";
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length > 0) {
        setOpen(true);
        setActiveIndex((index) => (index + 1) % results.length);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (results.length > 0) {
        setActiveIndex((index) =>
          index <= 0 ? results.length - 1 : index - 1,
        );
      }
    } else if (event.key === "Enter") {
      const active = activeIndex >= 0 ? results[activeIndex] : undefined;
      if (showDropdown && active) {
        event.preventDefault();
        setOpen(false);
        onNavigate?.();
        router.push(`/products/${active.id_produit}`);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const priceLabel = (product: SearchSuggestion) => {
    if (product.quantite_produit <= 0) {
      return tp("unavailable");
    }
    if (product.priceCents === null) {
      return tp("pricingUnavailable");
    }
    return `${formatPriceCents(product.priceCents, locale)}${periodSuffix(
      product.type_facturation,
    )}`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <form
        action={`/${locale}/search`}
        className="relative w-full"
        method="GET"
        onSubmit={(event) => {
          event.preventDefault();
          goToSearch(query);
        }}
        role="search"
      >
        <label className="sr-only" htmlFor="public-header-search">
          {t("searchPlaceholder")}
        </label>
        <input
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showDropdown}
          autoComplete="off"
          className="h-11 w-full rounded-md border border-slate-300 bg-white px-4 pr-11 text-sm text-slate-950 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-0"
          id="public-header-search"
          name="q"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (canSearch) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={t("searchButton")}
          role="combobox"
          type="text"
          value={query}
        />
        <button
          aria-label={t("searchButton")}
          className="absolute right-3 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          type="submit"
        >
          <Search aria-hidden="true" className="size-5" />
        </button>
      </form>

      {showDropdown && (
        <div
          className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">{ts("searching")}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-500">{ts("noResults")}</p>
          ) : (
            <ul className="max-h-[60vh] divide-y divide-slate-100 overflow-auto">
              {results.map((product, index) => (
                <li
                  aria-selected={index === activeIndex}
                  key={product.id_produit}
                  role="option"
                >
                  <Link
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition",
                      index === activeIndex
                        ? "bg-purple-50"
                        : "hover:bg-slate-50",
                    )}
                    href={`/products/${product.id_produit}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                      {product.imageUrl ? (
                        <span
                          aria-label={product.nom_pro}
                          className="h-full w-full bg-cover bg-center"
                          role="img"
                          style={{
                            backgroundImage: `url(${JSON.stringify(
                              product.imageUrl,
                            )})`,
                          }}
                        />
                      ) : (
                        <ImageOff
                          aria-hidden="true"
                          className="size-5 text-slate-400"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-950">
                        {product.nom_pro}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs">
                        {product.cat_nom && (
                          <span className="truncate text-slate-500">
                            {product.cat_nom}
                          </span>
                        )}
                        <span className="ml-auto shrink-0 font-semibold text-purple-700">
                          {priceLabel(product)}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {results.length > 0 && (
            <button
              className="flex w-full items-center justify-between border-t border-slate-100 px-4 py-2.5 text-sm font-medium text-purple-700 transition hover:bg-purple-50"
              onClick={() => goToSearch(query)}
              type="button"
            >
              {ts("viewAllResults")}
              <Search aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
