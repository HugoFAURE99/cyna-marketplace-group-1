"use client";

// In-chat link card to the Help & Support page (FAQ + ticket form). Surfaced
// when CynAI calls the show_support_page tool.
import { ArrowRight, LifeBuoy } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export default function ChatSupportCard() {
  const t = useTranslations("chat");

  return (
    <Link
      href="/faq"
      className="group flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2.5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-purple-700 text-white">
        <LifeBuoy aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">
          {t("supportCardTitle")}
        </p>
        <p className="truncate text-xs text-slate-500">
          {t("supportCardSubtitle")}
        </p>
      </div>
      <ArrowRight
        aria-hidden="true"
        className="size-4 shrink-0 text-purple-600 transition group-hover:translate-x-0.5"
      />
    </Link>
  );
}
