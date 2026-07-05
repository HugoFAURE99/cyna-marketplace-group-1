"use client";

import { Link } from "@/i18n/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { User, Package, RefreshCw, CreditCard, MapPin, Wallet } from "lucide-react";

type SidebarItem = {
  title: string;
  url: string;
  icon: string;
};

const iconMap: Record<string, React.ElementType> = {
  "user": User,
  "package": Package,
  "refresh": RefreshCw,
  "credit-card": CreditCard,
  "map-pin": MapPin,
  "wallet": Wallet,
};

export function UserDashboardSidebarMenu({ items }: { items: SidebarItem[] }) {
  const { setOpenMobile, isMobile } = useSidebar();

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = iconMap[item.icon];
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              render={
                <Link href={item.url} onClick={handleClick}>
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.title}</span>
                </Link>
              }
            />
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
