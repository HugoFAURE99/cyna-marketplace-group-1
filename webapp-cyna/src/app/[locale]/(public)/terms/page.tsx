import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n/translations";

export default async function Terms({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  return (
    <>
      <div className="flex justify-center my-10">
        <div className="p-5">
          <h1 className="text-3xl font-bold text-purple-800 mb-15">
            {t("title")}
          </h1>
          <h2 className="text-xl font-bold text-purple-600 mb-3">
            {t("subtitle1")}
          </h2>
          <p className="w-200 text-lg text-base/4">{t("paragraph1")}</p>
          <h2 className="text-xl font-bold text-purple-600 mt-14 mb-3">
            {t("subtitle2")}
          </h2>
          <p className="w-200 text-lg text-base/4">{t("paragraph2")}</p>
          <h2 className="text-xl font-bold text-purple-600 mt-14 mb-3">
            {t("subtitle3")}
          </h2>
          <p className="w-200 text-lg text-base/4">{t("paragraph3")}</p>
          <h2 className="text-xl font-bold text-purple-600 mt-14 mb-3">
            {t("subtitle4")}
          </h2>
          <p className="w-200 text-lg text-base/4">{t("paragraph4")}</p>
          <h2 className="text-xl font-bold text-purple-600 mt-14 mb-3">
            {t("subtitle5")}
          </h2>
          <p className="w-200 text-lg text-base/4">{t("paragraph5")}</p>
          <h2 className="text-xl font-bold text-purple-600 mt-14 mb-3">
            {t("subtitle6")}
          </h2>
          <p className="w-200 text-lg text-base/4">{t("paragraph6")}</p>
          <h2 className="text-xl font-bold text-purple-600 mt-14 mb-3">
            {t("subtitle7")}
          </h2>
          <p className="w-200 text-lg text-base/4">{t("paragraph7")}</p>
        </div>
      </div>
    </>
  );
}
