import { formatPriceCents } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/translations";
import {
  formatPromotionDiscount,
  type AutomaticPromotion,
} from "@/lib/promotions/automatic-promotion";
import { cn } from "@/lib/utils";

type PromotionalPriceProps = {
  automaticPromotion: AutomaticPromotion | null;
  badgeLabel: (discount: string) => string;
  className?: string;
  locale: Locale;
  originalPriceCents: number;
  periodSuffix?: string;
  priceClassName?: string;
  promotionalPriceCents: number;
};

export default function PromotionalPrice({
  automaticPromotion,
  badgeLabel,
  className,
  locale,
  originalPriceCents,
  periodSuffix = "",
  priceClassName,
  promotionalPriceCents,
}: PromotionalPriceProps) {
  if (!automaticPromotion || promotionalPriceCents >= originalPriceCents) {
    return (
      <span className={cn("font-semibold text-purple-700", className, priceClassName)}>
        {formatPriceCents(originalPriceCents, locale)}{periodSuffix}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <del className="text-xs font-medium text-slate-500 decoration-2">
        {formatPriceCents(originalPriceCents, locale)}{periodSuffix}
      </del>
      <span className={cn("font-bold text-purple-700", priceClassName)}>
        {formatPriceCents(promotionalPriceCents, locale)}{periodSuffix}
      </span>
      <span className="inline-flex rounded-full bg-fuchsia-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fuchsia-800">
        {badgeLabel(formatPromotionDiscount(automaticPromotion, locale))}
      </span>
    </span>
  );
}
