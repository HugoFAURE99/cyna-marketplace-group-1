"use server";

import { getCommerceReport } from "@/lib/admin/commerce-report";
import type {
  CommerceReportData,
  ReportPreset,
  ReportRangeErrorCode,
  SubscriptionHorizon,
} from "@/lib/admin/commerce-report-types";
import {
  createReportRange,
  isReportRangeError,
} from "@/lib/admin/report-range";
import type { Locale } from "@/lib/i18n/translations";
import { requireActiveAal2Admin } from "@/lib/auth/admin-guard";

export async function getCommerceReportAction(input: {
  from?: string;
  locale: Locale;
  preset: ReportPreset;
  horizon?: SubscriptionHorizon;
  to?: string;
}): Promise<
  | { data: CommerceReportData; ok: true }
  | { error: ReportRangeErrorCode; ok: false }
> {
  await requireActiveAal2Admin();
  try {
    const range = createReportRange(input.preset, { from: input.from, to: input.to });
    return {
      data: await getCommerceReport(range, input.locale, input.horizon ?? 30),
      ok: true,
    };
  } catch (error) {
    if (isReportRangeError(error)) return { error: error.code, ok: false };
    throw error;
  }
}
