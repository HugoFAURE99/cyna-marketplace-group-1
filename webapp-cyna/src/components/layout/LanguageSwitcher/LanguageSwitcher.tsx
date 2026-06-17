"use client";

// Subtle "FR / EN" text toggle that swaps the locale on the current path.
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      aria-label={t("languageSwitcher")}
      className="ml-1.5 flex items-center gap-1.5 text-xs font-medium"
      role="group"
    >
      {routing.locales.map((loc, index) => (
        <span className="flex items-center gap-1.5" key={loc}>
          {index > 0 && (
            <span aria-hidden="true" className="text-slate-300">
              /
            </span>
          )}
          <button
            aria-current={loc === locale ? "true" : undefined}
            className={cn(
              "cursor-pointer uppercase transition-colors",
              loc === locale
                ? "font-semibold text-slate-900"
                : "text-slate-400 hover:text-slate-700",
            )}
            onClick={() => router.replace(pathname, { locale: loc })}
            type="button"
          >
            {loc}
          </button>
        </span>
      ))}
    </div>
  );
}
