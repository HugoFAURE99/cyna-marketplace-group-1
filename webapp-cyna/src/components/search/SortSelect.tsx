"use client";

// Sort control for the search/browse page. Writes the chosen order into the
// `sort` query param (dropping `page` so the user lands on the first page),
// keeping the URL the single source of truth like the rest of the filters.
import { useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { SORT_KEYS, type SortKey } from "@/lib/products/catalog-sort";

const SORT_LABEL_KEYS = {
  relevance: "sortRelevance",
  "price-asc": "sortPriceAsc",
  "price-desc": "sortPriceDesc",
  newest: "sortNewest",
  oldest: "sortOldest",
  availability: "sortAvailability",
  "name-asc": "sortNameAsc",
} as const satisfies Record<SortKey, string>;

export default function SortSelect({ sort }: { sort: SortKey }) {
  const t = useTranslations("search");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const onValueChange = (value: string | null) => {
    if (!value) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    if (value === "relevance") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    params.delete("page");
    const next = params.toString();
    startTransition(() => {
      router.replace(next ? `${pathname}?${next}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <div className="flex items-center gap-2" aria-busy={isPending}>
      <span className="whitespace-nowrap text-sm text-slate-600">
        {t("sortBy")}
      </span>
      <Select onValueChange={onValueChange} value={sort}>
        <SelectTrigger className="h-9 w-[190px]" aria-label={t("sortBy")}>
          <SelectValue>
            {(value) => t(SORT_LABEL_KEYS[value as SortKey] ?? "sortRelevance")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SORT_KEYS.map((key) => (
            <SelectItem key={key} label={t(SORT_LABEL_KEYS[key])} value={key}>
              {t(SORT_LABEL_KEYS[key])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
