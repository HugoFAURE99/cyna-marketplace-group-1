import { Package, Layers } from "lucide-react";
import { getTranslations } from "next-intl/server";

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
  { labelKey: "products", href: "/admin/products", icon: Package },
  { labelKey: "categories", href: "/admin/categories", icon: Layers },
] as const;

export async function AdminSidebar() {
  const t = await getTranslations("admin.nav");

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("backoffice")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />}>
                    <item.icon />
                    <span>{t(item.labelKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
