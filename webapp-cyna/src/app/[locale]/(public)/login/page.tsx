import { getTranslations, setRequestLocale } from "next-intl/server";

import { LoginForm } from "@/components/connection/login-form";
import type { Locale } from "@/lib/i18n/translations";

export default async function Login({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.login");

  return (
    <>
      <div className="flex justify-center mt-5">
        <div className="w-50"></div>
        <div>
          <div className="my-10 text-center">
            <h1 className="text-3xl font-bold mb-5">{t("title")}</h1>
            <p>{t("subtitle")}</p>
          </div>
          <div className="h-100 w-100">
            <LoginForm />
          </div>
        </div>
        <div className="w-50"></div>
      </div>
    </>
  );
}
