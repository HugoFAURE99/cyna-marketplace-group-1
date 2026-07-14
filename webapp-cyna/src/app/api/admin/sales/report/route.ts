import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";

import { CommerceReportPdf } from "@/lib/admin/CommerceReportPdf";
import { getCommerceReport } from "@/lib/admin/commerce-report";
import type { ReportPreset, SubscriptionHorizon } from "@/lib/admin/commerce-report-types";
import { createReportRange } from "@/lib/admin/report-range";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";

const PRESETS = new Set<ReportPreset>(["7d", "30d", "90d", "ytd", "custom"]);
const HORIZONS = new Set<SubscriptionHorizon>([7, 30, 60, 90]);

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

  const [{ data: profile }, { data: assurance }] = await Promise.all([
    supabase.from("utilisateur").select("role, is_actif").eq("id_compte", user.id).maybeSingle(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  if (profile?.role !== "admin" || !profile.is_actif) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (assurance?.currentLevel !== "aal2") {
    return NextResponse.json({ error: "AAL2_REQUIRED" }, { status: 403 });
  }

  const locale: Locale = request.nextUrl.searchParams.get("locale") === "en" ? "en" : "fr";
  const requestedPreset = request.nextUrl.searchParams.get("preset") as ReportPreset | null;
  const preset = requestedPreset && PRESETS.has(requestedPreset) ? requestedPreset : "30d";

  try {
    const range = createReportRange(preset, {
      from: request.nextUrl.searchParams.get("from") ?? undefined,
      to: request.nextUrl.searchParams.get("to") ?? undefined,
    });
    const requestedHorizon = Number(request.nextUrl.searchParams.get("horizon"));
    const horizon = HORIZONS.has(requestedHorizon as SubscriptionHorizon)
      ? requestedHorizon as SubscriptionHorizon
      : 30;
    const data = await getCommerceReport(range, locale, horizon);
    const document = createElement(CommerceReportPdf, { data }) as unknown as Parameters<
      typeof renderToBuffer
    >[0];
    const pdf = await renderToBuffer(document);
    const filename = `CYNA-report-${range.from}_${range.to}.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REPORT_FAILED";
    return NextResponse.json({ error: message }, { status: message === "INVALID_RANGE" ? 400 : 500 });
  }
}
