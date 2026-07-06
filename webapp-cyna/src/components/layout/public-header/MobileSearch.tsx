"use client";

// Mobile-only search: the header search bar is hidden below the `md` breakpoint,
// so this exposes a toggle that drops a full-width search row under the header.
// Reuses the same autocomplete as desktop; closes on navigation and on Escape.
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import SearchAutocomplete from "@/components/layout/public-header/SearchAutocomplete";

export default function MobileSearch() {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        aria-controls="mobile-search-panel"
        aria-expanded={open}
        aria-label={open ? t("searchClose") : t("searchOpen")}
        className="inline-flex size-9 items-center justify-center rounded-md text-slate-950 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-6" />
        ) : (
          <Search aria-hidden="true" className="size-6" />
        )}
      </button>

      {open && (
        <div
          className="fixed inset-x-0 top-[72px] z-40 border-b border-slate-200 bg-white p-3 shadow-sm"
          id="mobile-search-panel"
        >
          <SearchAutocomplete onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
