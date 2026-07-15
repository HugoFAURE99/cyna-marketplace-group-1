import type { routing } from "@/i18n/routing";
import type messages from "./messages/en.json";

// Gives next-intl type-safe locales and message keys app-wide
// (useTranslations/getTranslations autocomplete + compile-time key checks).
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
