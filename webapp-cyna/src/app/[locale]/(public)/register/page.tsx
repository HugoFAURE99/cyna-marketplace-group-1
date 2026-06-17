import { getTranslations, setRequestLocale } from "next-intl/server";

import { RegisterForm } from "@/components/connection/register-form";
import type { Locale } from "@/lib/i18n/translations";

export default async function Register({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.register");

  return (
    <>
      <div className="flex justify-center mt-5">
        <div>
          <div className="my-10 text-center">
            <h1 className="text-3xl font-bold mb-5">{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          <div className="h-100 w-100">
            <RegisterForm />
          </div>
        </div>
      </div>
    </>
  );
}
