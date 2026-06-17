import { getTranslations, setRequestLocale } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.dashboard");

  return (
    <div>
      <h1>{t("title")}</h1>
      <Button nativeButton={false} render={<Link href="/admin/products" />}>
        {t("subtitle")}
      </Button>
    </div>
  );
}
