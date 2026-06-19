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
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="w-full">
          <UpdatePasswordForm />
        </div>
      </div>
    </main>
  );
}
