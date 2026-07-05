import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

import { Link, redirect } from "@/i18n/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { UserDashboardSidebarMenu } from "@/components/layout/user-dashboard-sidebar";

export default async function PublicLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("user_dashboard");

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/", locale: locale as Locale });
  }

  let addressesCount = 0;
  if (user) {
    const { count } = await supabase
      .from("adresse")
      .select("*", { count: "exact", head: true })
      .eq("id_compte", user.id)
      .eq("is_deleted", false);
    addressesCount = count || 0;
  }

  const items = [
    { title: t("account"), url: "/user-dashboard/infos", icon: "user" },
    { title: t("orders"), url: "/user-dashboard/orders", icon: "package" },
    { title: t("subscriptions"), url: "/user-dashboard/subscriptions", icon: "refresh" },
    { title: t("billing"), url: "/user-dashboard/billing", icon: "credit-card" },
    { title: t("addresses"), url: "/user-dashboard/addresses", icon: "map-pin" }
  ];

  return (
    <SidebarProvider>
      <Sidebar className="top-29! h-[calc(100vh-116px)]!">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <UserDashboardSidebarMenu items={items} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 w-full min-w-0">
        <div className="p-4 md:hidden">
          <SidebarTrigger />
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
