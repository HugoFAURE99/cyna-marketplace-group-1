"use client";

// Search-page filter panel. Each control writes its state into the URL query
// string (preserving the others), so the server re-renders the filtered list.
// The URL stays the single source of truth, which keeps results shareable.
import { useCallback, useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";

const ALL_CATEGORIES = "all";
const PRICE_DEBOUNCE_MS = 400;

type SearchFiltersProps = {
  categories: { id_categorie: number; cat_nom: string }[];
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
};

export default function SearchFilters({
  categories,
  categoryId,
  minPrice,
  maxPrice,
  inStockOnly,
}: SearchFiltersProps) {
  const t = useTranslations("search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Price inputs are buffered locally and pushed to the URL after a debounce.
  const [minInput, setMinInput] = useState(minPrice?.toString() ?? "");
  const [maxInput, setMaxInput] = useState(maxPrice?.toString() ?? "");

  const commitParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const next = params.toString();
      if (next === searchParams.toString()) {
        return;
      }
      startTransition(() => {
        router.replace(next ? `${pathname}?${next}` : pathname, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounced commit of the price bounds.
  useEffect(() => {
    const timer = setTimeout(() => {
      commitParams({ min: minInput || undefined, max: maxInput || undefined });
    }, PRICE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [minInput, maxInput, commitParams]);

  const hasActiveFilters =
    categoryId !== undefined ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStockOnly;
  const categoryLabels = new Map([
    [ALL_CATEGORIES, t("allCategories")],
    ...categories.map(
      (category) => [String(category.id_categorie), category.cat_nom] as const,
    ),
  ]);

  const clearFilters = () => {
    setMinInput("");
    setMaxInput("");
    commitParams({
      category: undefined,
      min: undefined,
      max: undefined,
      instock: undefined,
    });
  };

  return (
    <div
      aria-busy={isPending}
      className="space-y-6 rounded-lg border border-slate-200 bg-slate-50 p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-950">
          {t("filters")}
        </h2>
        {hasActiveFilters && (
          <Button
            className="h-auto px-2 py-1 text-xs text-purple-700 hover:text-purple-800"
            onClick={clearFilters}
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("clearFilters")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-category">{t("category")}</Label>
        <Select
          onValueChange={(value) =>
            commitParams({
              category: value && value !== ALL_CATEGORIES ? value : undefined,
            })
          }
          value={categoryId !== undefined ? String(categoryId) : ALL_CATEGORIES}
        >
          <SelectTrigger className="h-10 w-full" id="filter-category">
            <SelectValue>
              {(value) => categoryLabels.get(String(value)) ?? t("allCategories")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem label={t("allCategories")} value={ALL_CATEGORIES}>
              {t("allCategories")}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem
                key={category.id_categorie}
                label={category.cat_nom}
                value={String(category.id_categorie)}
              >
                {category.cat_nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="filter-price-min">{t("priceRange")}</Label>
        <div className="flex items-center gap-2">
          <Input
            aria-label={t("minPrice")}
            className="h-10"
            id="filter-price-min"
            inputMode="numeric"
            min={0}
            onChange={(event) => setMinInput(event.target.value)}
            placeholder={t("minPrice")}
            type="number"
            value={minInput}
          />
          <span className="text-slate-400">–</span>
          <Input
            aria-label={t("maxPrice")}
            className="h-10"
            inputMode="numeric"
            min={0}
            onChange={(event) => setMaxInput(event.target.value)}
            placeholder={t("maxPrice")}
            type="number"
            value={maxInput}
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          checked={inStockOnly}
          className="size-4 rounded border-slate-300 accent-purple-700"
          onChange={(event) =>
            commitParams({ instock: event.target.checked ? "1" : undefined })
          }
          type="checkbox"
        />
        {t("inStockOnly")}
      </label>
    </div>
  );
}
