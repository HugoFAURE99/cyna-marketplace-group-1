import { getTranslations, setRequestLocale } from "next-intl/server";

import type { Locale } from "@/lib/i18n/translations";

export default async function Contact({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <>
      <div className="flex justify-center mt-10">
        <div className="p-5">
          <h1 className="text-2xl font-bold text-purple-800 mb-10">
            {t("title")}
          </h1>
          <p className="w-200 mt-4 mb-1 text-xl">{t("landline")} : </p>
          <p className="w-200 text-gray-500 text-lg">+33 1 99 00 34 56</p>
          <p className="w-200 mt-4 mb-1 text-xl">{t("mobile")} : </p>
          <p className="w-200 text-gray-500 text-lg">+33 6 99 00 78 90</p>
          <p className="w-200 mt-4 mb-1 text-xl">{t("email")} : </p>
          <p className="w-200 text-gray-500 text-lg">marketing@cyna-it.fr</p>
        </div>
      </div>
    </>
  );
}
