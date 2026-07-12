import { Info } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BillingList } from "@/components/account/billing-list";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { createServerClient } from "@/lib/supabase/server-client";
import type { Tables } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function PurchaseInvoices({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("billing");
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let invoices: Tables<"facture">[] = [];
  if (user) {
    const { data, error } = await supabase
      .from("facture")
      .select("*")
      .order("date_facture", { ascending: false });
    if (error) console.error("[purchases/invoices] query failed", error);
    invoices = data ?? [];
  }
  return <div className="space-y-6"><BillingList invoices={invoices} locale={locale} /><p className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><Info aria-hidden="true" className="size-4" /><span>{t("invoiceWarning")}</span><Link className="font-medium text-purple-700 hover:underline" href="/faq#contact">{t("supportLink")}</Link></p></div>;
}
