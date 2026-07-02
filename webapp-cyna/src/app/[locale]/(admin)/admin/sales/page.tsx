import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSalesData } from "@/app/[locale]/(admin)/admin/_actions/sales.actions";
import { SalesDashboard } from "@/components/admin/SalesDashboard/SalesDashboard";
import type { Locale } from "@/lib/i18n/translations";

export default async function SalesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin.sales");

  const initialData = await getSalesData("7days");

  const translations = {
    title: t("title"),
    last7days: t("last7days"),
    last5weeks: t("last5weeks"),
    salesPerDay: t("salesPerDay"),
    salesPerWeek: t("salesPerWeek"),
    avgCartByCategory: t("avgCartByCategory"),
    salesByCategory: t("salesByCategory"),
    total: t("total"),
    noData: t("noData"),
    period: t("period"),
  };

  return (
    <div>
      <SalesDashboard
        initialData={initialData}
        translations={translations}
      />
    </div>
  );
}
