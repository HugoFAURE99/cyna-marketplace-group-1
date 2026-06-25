import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

import { Link, redirect } from "@/i18n/navigation";
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

  return (
    <div className="flex">
      <div className="flex min-h-screen w-70  align-center py-5 border border-radius-8 shadow-sm px-5">
        <nav>
          <ul className="flex flex-col gap-4 w-full">
            <li className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
              <Link href="/user-dashboard/infos" className="block w-full">{t("account")}</Link>
            </li>
            <li className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
              <Link href="/user-dashboard/orders" className="block w-full">{t("orders")}</Link>
            </li>
            <li className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
              <Link href="/user-dashboard/subscriptions" className="block w-full">{t("subscriptions")}</Link>
            </li>
            <li className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
              <Link href="/user-dashboard/billing" className="block w-full">{t("billing")}</Link>
            </li>
            <li className="cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors flex items-center justify-between">
              <Link href="/user-dashboard/addresses" className="block w-full">{t("addresses")}</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mt-5 pl-50">{children}</div>
    </div>
  );
}
