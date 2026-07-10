"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, Package, Layers, Users, BarChart3, ShoppingCart, Percent } from "lucide-react";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher/LanguageSwitcher";

const menuItems = [
  { labelKey: "homepage", href: "/admin", icon: Home, exact: true },
  { labelKey: "products", href: "/admin/products", icon: Package, exact: false },
  { labelKey: "categories", href: "/admin/categories", icon: Layers, exact: false },
  { labelKey: "users", href: "/admin/users", icon: Users, exact: false },
  { labelKey: "orders", href: "/admin/orders", icon: ShoppingCart, exact: false },
  { labelKey: "promotions", href: "/admin/promotions", icon: Percent, exact: false },
  { labelKey: "sales", href: "/admin/sales", icon: BarChart3, exact: false },
] as const;

interface Labels {
  backoffice: string;
  homepage: string;
  products: string;
  categories: string;
  users: string;
  orders: string;
  promotions: string;
  sales: string;
}

export default function AdminSidebarClient({ labels }: { labels: Labels }) {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) => {
    // Strip locale prefix (e.g. /fr/admin/products -> /admin/products)
    const clean = pathname.replace(/^\/(fr|en)/, "");
    if (exact) return clean === href;
    return clean.startsWith(href);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <Image
            src="/brand/cyna-logo-v2-header.svg"
            alt="CYNA"
            width={96}
            height={26}
            className="h-auto w-[96px]"
            priority
          />
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Admin
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{labels.backoffice}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      className={active ? "bg-primary/10 text-primary font-medium" : ""}
                    >
                      <item.icon />
                      <span>{labels[item.labelKey]}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto p-3">
          <LanguageSwitcher />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
