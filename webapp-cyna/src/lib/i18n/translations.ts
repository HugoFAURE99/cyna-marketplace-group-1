import { routing } from "@/i18n/routing";

export type Locale = (typeof routing.locales)[number];

// Picks the companion-table row for the active locale, falling back to the
// default locale (then any available row) so the UI never shows blanks while
// English translations are still being filled in via the admin UI.
export function pickTranslation<T extends { langue: string }>(
  rows: T[] | null | undefined,
  locale: string,
): T | undefined {
  if (!rows || rows.length === 0) {
    return undefined;
  }

  return (
    rows.find((row) => row.langue === locale) ??
    rows.find((row) => row.langue === routing.defaultLocale) ??
    rows[0]
  );
}
