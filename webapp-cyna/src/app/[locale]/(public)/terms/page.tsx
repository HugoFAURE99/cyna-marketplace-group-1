import { getTranslations, setRequestLocale } from "next-intl/server";

import ContentPage, { ContentSection } from "@/components/layout/ContentPage";
import type { Locale } from "@/lib/i18n/translations";

export default async function Terms({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  const sections = [
    { title: t("subtitle1"), body: t("paragraph1") },
    { title: t("subtitle2"), body: t("paragraph2") },
    { title: t("subtitle3"), body: t("paragraph3") },
    { title: t("subtitle4"), body: t("paragraph4") },
    { title: t("subtitle5"), body: t("paragraph5") },
    { title: t("subtitle6"), body: t("paragraph6") },
    { title: t("subtitle7"), body: t("paragraph7") },
  ];

  return (
    <ContentPage title={t("title")} width="wide">
      {sections.map((section, index) => (
        <ContentSection index={index + 1} key={index} title={section.title}>
          <p>{section.body}</p>
        </ContentSection>
      ))}
    </ContentPage>
  );
}
