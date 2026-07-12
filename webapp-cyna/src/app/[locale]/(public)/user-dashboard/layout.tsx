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
    { title: t("purchases"), url: "/user-dashboard/purchases", icon: "package" },
    { title: t("addresses"), url: "/user-dashboard/addresses", icon: "map-pin" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 max-w-full">
          <UserDashboardNav items={items} title={tMenu("myAccount")} />
        </aside>
        <main className="min-w-0 max-w-full">{children}</main>
      </div>
    </div>
  );
}
