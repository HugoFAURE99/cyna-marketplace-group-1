"use client";

// Compact "Categories" dropdown in the header. Replaces the old full-width
// category strip: same quick access to every category, but it no longer eats a
// whole row. Closes on outside click and Escape.
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Category = { id_categorie: number; cat_nom: string };

export default function CategoryMenu({
  categories,
}: {
  categories: Category[];
}) {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const itemClass =
    "block truncate rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:bg-purple-50 focus-visible:text-purple-700";

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-700 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 sm:px-3"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <LayoutGrid aria-hidden="true" className="size-4 shrink-0" />
        <span className="hidden sm:inline">{t("categories")}</span>
        <ChevronDown
          aria-hidden="true"
          className={cn("size-4 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] w-60 overflow-auto rounded-md border border-slate-200 bg-white p-1 shadow-lg"
          role="menu"
        >
          <Link
            className={cn(itemClass, "font-medium")}
            href="/search"
            onClick={() => setOpen(false)}
            role="menuitem"
          >
            {t("allProducts")}
          </Link>
          {categories.length > 0 && (
            <div aria-hidden="true" className="my-1 h-px bg-slate-100" />
          )}
          {categories.map((category) => (
            <Link
              className={itemClass}
              href={`/search?category=${category.id_categorie}`}
              key={category.id_categorie}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {category.cat_nom}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
