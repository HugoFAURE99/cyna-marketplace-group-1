"use client";

// Compact category card rendered inside the chat from a tool result. Links to
// the dedicated storefront page for that category.
import { ChevronRight, Layers } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { ChatCategoryItem } from "@/lib/gemini/types";

export default function ChatCategoryCard({
  category,
}: {
  category: ChatCategoryItem;
}) {
  return (
    <Link
      href={`/categories/${category.id_categorie}`}
      className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:text-purple-700 hover:shadow-md"
    >
      <Layers aria-hidden="true" className="size-4 shrink-0 text-purple-600" />
      <span className="min-w-0 flex-1 truncate">{category.cat_nom}</span>
      <ChevronRight
        aria-hidden="true"
        className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-purple-600"
      />
    </Link>
  );
}
