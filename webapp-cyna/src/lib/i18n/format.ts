import type { Locale } from "@/lib/i18n/translations";

// Prices are stored as integer cents (EUR). Format per locale, hiding a
// trailing ".00" for round amounts. Currency stays EUR (Stripe is EUR-only);
// only the presentation (symbol placement, separators) follows the locale.
export function formatPriceCents(cents: number, locale: Locale) {
  const hasCents = cents % 100 !== 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: hasCents ? 2 : 0,
    minimumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100);
}
