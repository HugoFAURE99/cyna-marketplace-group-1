import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";

import { Link } from "@/i18n/navigation";

export default async function PublicLayout({
  params,
  children,
}: Readonly<{
  params: Promise<{ locale: Locale }>;
  children: React.ReactNode;
}>) {
  const t = await getTranslations("user_dashboard");

  return (
    <div className="flex">
      <div className="flex min-h-screen w-70  align-center py-5 border border-radius-8 shadow-sm px-5">
        <nav>
          <ul className="flex flex-col gap-4">
            <li className="cursor-pointer">
              <Link href="/user-dashboard/infos">{t("account")}</Link>
            </li>
            <li className="cursor-pointer">
              <Link href="/user-dashboard/orders">{t("orders")}</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="mt-5 pl-50">{children}</div>
    </div>
  );
}
