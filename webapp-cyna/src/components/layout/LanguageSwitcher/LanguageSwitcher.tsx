"use client";

// Minimal language select: the header trigger shows only the current language's
// flag; clicking it reveals the other available language(s). Switching keeps the
// current path and query string, only swapping the locale.
import { useEffect, useRef, useState, type ReactElement } from "react";
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

type FlagProps = { className?: string };

const FLAGS: Record<string, (props: FlagProps) => ReactElement> = {
  fr: FranceFlag,
  en: UnitedKingdomFlag,
};

const FLAG_CLASS = "h-4 w-6 rounded-[3px] shadow-sm ring-1 ring-black/10";

export default function LanguageSwitcher({
  fullWidth = false,
  label,
  placement = "bottom",
}: {
  fullWidth?: boolean;
  label?: string;
  placement?: "bottom" | "top";
} = {}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const switchTo = (loc: Locale) => {
    setOpen(false);
    if (loc === locale) return;
    // Preserve the current query string (read at click time, client-side).
    const queryString =
      typeof window !== "undefined" ? window.location.search : "";
    router.replace(`${pathname}${queryString}`, { locale: loc });
  };

  const CurrentFlag = FLAGS[locale];
  const otherLocales = routing.locales.filter((loc) => loc !== locale);

  return (
    <div className={cn("relative", fullWidth && "w-full")} ref={containerRef}>
      <button
        aria-expanded={open}
        aria-controls="language-options"
        aria-label={t("languageSwitcher")}
        className={cn(
          "flex min-h-11 cursor-pointer items-center justify-center transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 active:bg-slate-200",
          fullWidth ? "w-full justify-between rounded-md px-3" : "size-11 rounded-full",
        )}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {label && <span className="text-sm font-medium text-slate-700">{label}</span>}
        <span className={cn("flex items-center", label && "gap-2")}>
          {CurrentFlag && <CurrentFlag className={FLAG_CLASS} />}
          {label && <span className="text-xs font-semibold uppercase text-slate-500">{locale}</span>}
        </span>
      </button>

      {open && (
        <ul
          className={cn(
            "absolute right-0 z-50 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg",
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2",
            fullWidth ? "w-full" : "w-[5.75rem]",
          )}
          id="language-options"
        >
          {otherLocales.map((loc) => {
            const Flag = FLAGS[loc];
            return (
              <li key={loc}>
                <button
                  className="flex min-h-11 w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-700 active:bg-purple-50"
                  onClick={() => switchTo(loc)}
                  type="button"
                >
                  {Flag && <Flag className={FLAG_CLASS} />}
                  <span className="uppercase">{loc}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function FranceFlag({ className }: FlagProps) {
  return (
    <svg
      className={className}
      preserveAspectRatio="none"
      viewBox="0 0 3 2"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="3" height="2" fill="#fff" />
      <rect width="1" height="2" fill="#0055A4" />
      <rect width="1" height="2" x="2" fill="#EF4135" />
    </svg>
  );
}

function UnitedKingdomFlag({ className }: FlagProps) {
  return (
    <svg
      className={className}
      preserveAspectRatio="none"
      viewBox="0 0 60 30"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="60" height="30" fill="#012169" />
      <g stroke="#fff" strokeWidth="6">
        <path d="M0 0 60 30" />
        <path d="M60 0 0 30" />
      </g>
      <g stroke="#C8102E" strokeWidth="2.5">
        <path d="M0 0 60 30" />
        <path d="M60 0 0 30" />
      </g>
      <rect x="25" width="10" height="30" fill="#fff" />
      <rect y="10" width="60" height="10" fill="#fff" />
      <rect x="27" width="6" height="30" fill="#C8102E" />
      <rect y="12" width="60" height="6" fill="#C8102E" />
    </svg>
  );
}
