"use client";

// Account section navigation: three equal mobile destinations and a sticky
// vertical sidebar on desktop. The mobile grid cannot widen the page.
import type { ElementType } from "react";
import { CreditCard, MapPin, MessagesSquare, Package, RefreshCw, UserRound } from "lucide-react";

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
  messages: MessagesSquare,
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
    <nav aria-label={title} className="min-w-0 max-w-full lg:sticky lg:top-[88px]">
      <p className="mb-3 hidden px-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:block">
        {title}
      </p>
      <ul className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:flex-col lg:gap-1">
        {items.map((item) => {
          const Icon = iconMap[item.icon];
          const active =
            pathname === item.url || pathname.startsWith(`${item.url}/`);

          return (
            <li className="min-w-0" key={item.url}>
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-full min-h-16 min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-medium leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 active:bg-purple-100 lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-2.5 lg:text-left lg:text-sm",
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
                <span className="min-w-0 break-words">{item.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
