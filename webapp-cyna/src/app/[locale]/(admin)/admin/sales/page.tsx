import { setRequestLocale } from "next-intl/server";

import { SalesDashboard } from "@/components/admin/SalesDashboard/SalesDashboard";
import { getCommerceReport } from "@/lib/admin/commerce-report";
import { createReportRange } from "@/lib/admin/report-range";
import type { ReportPreset } from "@/lib/admin/commerce-report-types";
import type { Locale } from "@/lib/i18n/translations";

export default async function SalesPage({ params, searchParams }: { params: Promise<{ locale: Locale }>; searchParams: Promise<{ tab?: string; horizon?: string; preset?: string; from?: string; to?: string }> }) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const requestedHorizon = Number(query.horizon);
  const horizon = ([7, 30, 60, 90] as const).find((value) => value === requestedHorizon) ?? 30;
  const requestedPreset: ReportPreset = query.preset === "5w" || query.preset === "custom"
    ? query.preset
    : "7d";
  let range;
  try {
    range = createReportRange(requestedPreset, { from: query.from, to: query.to });
  } catch {
    range = createReportRange("7d");
  }
  const initialData = await getCommerceReport(range, locale, horizon);
  return <SalesDashboard initialData={initialData} initialTab={query.tab === "subscriptions" ? "subscriptions" : "orders"} locale={locale} />;
}
