import { Info } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { BillingList } from "@/components/account/billing-list";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";
import { createAdminClient } from "@/lib/supabase/server";
import { createServerClient } from "@/lib/supabase/server-client";
import type { Tables } from "@/types/database.types";

export const dynamic = "force-dynamic";

export default async function Billing({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("billing");
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let invoices: Tables<"facture">[] = [];
  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("utilisateur")
      .select("adresse_mail")
      .eq("id_compte", user.id)
      .single();
    const ownership = profile?.adresse_mail
      ? `id_compte.eq.${user.id},email_client.ilike.${profile.adresse_mail}`
      : `id_compte.eq.${user.id}`;
    const { data, error } = await admin
      .from("facture")
      .select("*")
      .or(ownership)
      .order("date_facture", { ascending: false });
    if (error) console.error("[billing] invoice query failed", error);
    invoices = data ?? [];
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">
        {t("title")}
      </h1>
      <BillingList invoices={invoices} locale={locale} />
      <p className="flex items-center gap-2 text-xs text-slate-500">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        <span>{t("invoiceWarning")} </span>
        <Link className="shrink-0 font-medium text-purple-700 hover:underline" href="/faq#contact">
          {t("supportLink")}
        </Link>
      </p>
    </div>
  );
}
