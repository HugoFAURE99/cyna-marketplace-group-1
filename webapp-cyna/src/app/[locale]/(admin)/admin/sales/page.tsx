import { setRequestLocale } from "next-intl/server";

import { SalesDashboard } from "@/components/admin/SalesDashboard/SalesDashboard";
import { getCommerceReport } from "@/lib/admin/commerce-report";
import { createReportRange } from "@/lib/admin/report-range";
import type { Locale } from "@/lib/i18n/translations";

export default async function SalesPage({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ tab?: string; horizon?: string }> }) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const requestedHorizon = Number(query.horizon);
  const horizon = ([7, 30, 60, 90] as const).find((value) => value === requestedHorizon) ?? 30;
  const initialData = await getCommerceReport(createReportRange("30d"), locale, horizon);
  return <SalesDashboard initialData={initialData} initialTab={query.tab === "subscriptions" ? "subscriptions" : "orders"} locale={locale} />;
}
