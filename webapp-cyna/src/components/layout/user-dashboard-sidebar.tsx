"use client";

// Account section navigation. A clean, self-contained nav: a sticky vertical
// list on desktop and a tidy horizontal scroll strip on mobile, with an active
// highlight. Replaces the heavy shadcn off-canvas sidebar.
import type { ElementType } from "react";
import { CreditCard, MapPin, Package, RefreshCw, UserRound } from "lucide-react";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  url: string;
  icon: string;
};

const iconMap: Record<string, ElementType> = {
  user: UserRound,
  package: Package,
  refresh: RefreshCw,
  "credit-card": CreditCard,
  "map-pin": MapPin,
};

export function UserDashboardNav({
  items,
  title,
}: {
  items: NavItem[];
  title: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={title} className="lg:sticky lg:top-[88px]">
      <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">
        {title}
      </p>
      <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            pathname === item.url || pathname.startsWith(`${item.url}/`);

          return (
            <li className="shrink-0 lg:shrink" key={item.url}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 whitespace-nowrap rounded-md px-3 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700",
                  active
                    ? "bg-purple-50 font-semibold text-purple-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                )}
                href={item.url}
              >
                {Icon && (
                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      active ? "text-purple-700" : "text-slate-400",
                    )}
                  />
                )}
                {item.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
