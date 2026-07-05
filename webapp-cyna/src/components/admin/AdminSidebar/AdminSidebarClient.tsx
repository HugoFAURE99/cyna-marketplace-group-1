"use client";

import { usePathname } from "next/navigation";
import { Home, Package, Layers, Users, BarChart3, ShoppingCart, Percent } from "lucide-react";

import {
  Sidebar,
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
