import { getTranslations, setRequestLocale } from "next-intl/server";

import ContentPage from "@/components/layout/ContentPage";
import type { Locale } from "@/lib/i18n/translations";

export default async function About({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <ContentPage eyebrow="CYNA" title={t("title")}>
      <div className="space-y-5 text-base leading-7 text-slate-700">
        <p>{t("article")}</p>
        <p>{t("article2")}</p>
        <p>{t("article3")}</p>
      </div>
    </ContentPage>
  );
}
