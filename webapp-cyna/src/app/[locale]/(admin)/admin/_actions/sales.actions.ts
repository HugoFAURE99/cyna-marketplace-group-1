"use server";

import { getCommerceReport } from "@/lib/admin/commerce-report";
import type { CommerceReportData, ReportPreset, SubscriptionHorizon } from "@/lib/admin/commerce-report-types";
import { createReportRange } from "@/lib/admin/report-range";
import type { Locale } from "@/lib/i18n/translations";
import { requireActiveAal2Admin } from "@/lib/auth/admin-guard";

export async function getCommerceReportAction(input: {
  from?: string;
  locale: Locale;
  preset: ReportPreset;
  horizon?: SubscriptionHorizon;
  to?: string;
}): Promise<CommerceReportData> {
  await requireActiveAal2Admin();
  const range = createReportRange(input.preset, { from: input.from, to: input.to });
  return getCommerceReport(range, input.locale, input.horizon ?? 30);
}
