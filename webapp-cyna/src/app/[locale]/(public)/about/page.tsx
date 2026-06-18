import { getTranslations, setRequestLocale } from "next-intl/server";

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
    <>
      <div className="flex justify-center my-10">
        <div className="p-5">
          <h1 className="text-3xl font-bold text-purple-800 mb-10">
            {t("title")}
          </h1>
          <p className="w-200 text-lg">{t("article")}</p>
          <p className="w-200 text-lg my-10">{t("article2")}</p>
          <p className="w-200 text-lg">{t("article3")}</p>
        </div>
      </div>
    </>
  );
}
