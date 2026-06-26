import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/i18n/translations";
import { PaymentForm } from "@/components/account/payment-form";

export default async function Payment({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("payment");

  return (
    <div className="flex flex-col bg-white text-gray-900 font-sans w-full">
      <h1 className="text-3xl font-bold text-black mb-10">{t("title")}</h1>

      <div className="w-full max-w-md">
        <PaymentForm />
      </div>
    </div>
  );
}
