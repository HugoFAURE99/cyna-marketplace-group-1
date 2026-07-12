"use client";

import { useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const tabs = ["orders", "subscriptions", "invoices"] as const;

export function PurchasesTabs() {
  const pathname = usePathname();
  const t = useTranslations("purchases");

  return (
    <nav aria-label={t("title")} className="overflow-x-auto [scrollbar-width:thin]">
      <ul className="flex min-w-max gap-1 border-b border-slate-200">
        {tabs.map((tab) => {
          const href = `/user-dashboard/purchases/${tab}`;
          const active = pathname === href;
          return (
            <li key={tab}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center border-b-2 px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700",
                  active
                    ? "border-purple-700 text-purple-700"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-950",
                )}
                href={href}
              >
                {t(tab)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
