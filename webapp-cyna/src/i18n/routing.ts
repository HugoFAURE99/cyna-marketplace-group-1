import { defineRouting } from "next-intl/routing";

// Locales served by the app. French is the default (the marketplace content is
// authored in French); both locales are always shown in the URL (/fr, /en).
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always",
});
