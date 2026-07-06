import { getTranslations, setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { UserDashboardNav } from "@/components/layout/user-dashboard-sidebar";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

export default async function UserDashboardLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}>) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);
  const t = await getTranslations("user_dashboard");
  const tMenu = await getTranslations("menu");

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect({ href: "/", locale: locale as Locale });
  }

  const items = [
    { title: t("account"), url: "/user-dashboard/infos", icon: "user" },
    { title: t("orders"), url: "/user-dashboard/orders", icon: "package" },
    {
      title: t("subscriptions"),
      url: "/user-dashboard/subscriptions",
      icon: "refresh",
    },
    { title: t("billing"), url: "/user-dashboard/billing", icon: "credit-card" },
    { title: t("addresses"), url: "/user-dashboard/addresses", icon: "map-pin" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside>
          <UserDashboardNav items={items} title={tMenu("myAccount")} />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
