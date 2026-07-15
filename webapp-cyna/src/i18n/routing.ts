import { defineRouting } from "next-intl/routing";

// Locales served by the app. French is the default (the marketplace content is
// authored in French); both locales are always shown in the URL (/fr, /en).
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
  // Keep explicit URLs and a saved language choice authoritative. On a first
  // visit, negotiate fr/en from Accept-Language and fall back to French when
  // neither supported locale is present.
  localeDetection: true,
});
