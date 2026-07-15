import { getTranslations, setRequestLocale } from "next-intl/server";

import ContentPage, { ContentSection } from "@/components/layout/ContentPage";
import type { Locale } from "@/lib/i18n/translations";

export default async function Legal({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const publisherRows = [
    { label: t("webedit_ul1"), value: t("projectOwner") },
    { label: t("webedit_ul2"), value: t("projectStatus") },
    { label: t("webedit_ul3"), value: "Institut Limayrac, 50 rue de Limayrac, 31079 Toulouse Cedex 5" },
    { label: t("webedit_ul4"), value: t("notApplicable") },
    { label: t("webedit_ul5"), value: t("studentTeam") },
    { label: "Contact", value: "support.cyna@gmail.com" },
  ];
  return (
    <ContentPage title={t("legal_title")} intro={t("legal_paragraph")} width="wide">
      <ContentSection index={1} title={t("webedit_title")}><InfoList rows={publisherRows} /></ContentSection>
      <ContentSection index={2} title={t("hosting_title")}><p>{t("hosting_paragraph")}</p><InfoList rows={[{ label: t("hosting_title"), value: t("hostingValue") }]} /></ContentSection>
      <ContentSection index={3} title={t("intelprop_title")}><p>{t("intelprop_paragraph1")}</p><p>{t("intelprop_paragraph2")}</p><p>{t("intelprop_paragraph3")}</p></ContentSection>
      <ContentSection index={4} title={t("privacy_title")}><p>{t("privacy_paragraph1")}</p><p>{t("privacy_paragraph2")}</p></ContentSection>
      <ContentSection index={5} title={t("payment_security_title")}><p>{t("payment_security_paragraph")}</p></ContentSection>
    </ContentPage>
  );
}

function InfoList({ rows }: { rows: { label: string; value: string }[] }) {
  return <dl className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">{rows.map((row) => <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4" key={row.label}><dt className="font-semibold text-slate-900 sm:w-56 sm:shrink-0">{row.label}</dt><dd className="text-slate-700">{row.value}</dd></div>)}</dl>;
}
