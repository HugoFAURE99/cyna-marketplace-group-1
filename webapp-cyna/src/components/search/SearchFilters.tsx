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
import { usePathname, useRouter } from "@/i18n/navigation";

const PRICE_DEBOUNCE_MS = 400;

type SearchFiltersProps = {
  categories: { id_categorie: number; cat_nom: string }[];
  technicalCharacteristics: {
    id_caracteristique: number;
    nom_caracteristique: string;
  }[];
  categoryIds: number[];
  characteristicIds: number[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
};

export default function SearchFilters({
  categories,
  technicalCharacteristics,
  categoryIds,
  characteristicIds,
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
      params.delete("page");
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
    const syncedMin = minPrice?.toString() ?? "";
    const syncedMax = maxPrice?.toString() ?? "";
    if (minInput === syncedMin && maxInput === syncedMax) {
      return;
    }

    const timer = setTimeout(() => {
      commitParams({ min: minInput || undefined, max: maxInput || undefined });
    }, PRICE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [minInput, maxInput, minPrice, maxPrice, commitParams]);

  const hasActiveFilters =
    categoryIds.length > 0 ||
    characteristicIds.length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined ||
    inStockOnly;
  const selectedCharacteristicIds = new Set(characteristicIds);
  const selectedCategoryIds = new Set(categoryIds);

  const clearFilters = () => {
    setMinInput("");
    setMaxInput("");
    commitParams({
      category: undefined,
      tech: undefined,
      min: undefined,
      max: undefined,
      instock: undefined,
    });
  };

  const toggleFromSet = (
    current: number[],
    id: number,
    checked: boolean,
  ): string | undefined => {
    const nextIds = new Set(current);
    if (checked) {
      nextIds.add(id);
    } else {
      nextIds.delete(id);
    }
    return [...nextIds].sort((a, b) => a - b).join(",") || undefined;
  };

  const toggleCategory = (id: number, checked: boolean) => {
    commitParams({ category: toggleFromSet(categoryIds, id, checked) });
  };

  const toggleCharacteristic = (id: number, checked: boolean) => {
    commitParams({ tech: toggleFromSet(characteristicIds, id, checked) });
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

      {categories.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-950">
            {t("category")}
          </legend>
          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {categories.map((category) => (
              <label
                className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"
                key={category.id_categorie}
              >
                <input
                  checked={selectedCategoryIds.has(category.id_categorie)}
                  className="mt-0.5 size-4 rounded border-slate-300 accent-purple-700"
                  onChange={(event) =>
                    toggleCategory(category.id_categorie, event.target.checked)
                  }
                  type="checkbox"
                />
                <span>{category.cat_nom}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {technicalCharacteristics.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-950">
            {t("technicalCharacteristics")}
          </legend>
          <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {technicalCharacteristics.map((characteristic) => (
              <label
                className="flex cursor-pointer items-start gap-2 text-sm text-slate-700"
                key={characteristic.id_caracteristique}
              >
                <input
                  checked={selectedCharacteristicIds.has(
                    characteristic.id_caracteristique,
                  )}
                  className="mt-0.5 size-4 rounded border-slate-300 accent-purple-700"
                  onChange={(event) =>
                    toggleCharacteristic(
                      characteristic.id_caracteristique,
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span>{characteristic.nom_caracteristique}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

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
