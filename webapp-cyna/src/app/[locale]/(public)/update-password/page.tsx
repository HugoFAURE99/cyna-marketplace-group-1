import { getTranslations, setRequestLocale } from "next-intl/server";

import { UpdatePasswordForm } from "@/components/connection/update-password-form";
import type { Locale } from "@/lib/i18n/translations";

export default async function UpdatePassword({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth.updatePassword");

  return (
    <div className="flex justify-center mt-5">
      <div>
        <div className="my-10 text-center">
          <h1 className="text-3xl font-bold mb-5">{t("title")}</h1>
        </div>
        <div className="h-100 w-100">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
