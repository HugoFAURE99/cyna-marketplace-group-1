import { getTranslations, setRequestLocale } from "next-intl/server";
import { SubscriptionsList } from "@/components/account/subscriptions-list";
import type { Locale } from "@/lib/i18n/translations";
import { BackButton } from "@/components/account/back-button";
import { getAccountSubscriptions } from "@/lib/subscriptions/account-subscriptions";

export default async function OrderSubscriptions({ params }: { params: Promise<{ locale: Locale; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("subscriptions");
  const subscriptions = await getAccountSubscriptions(parseInt(id, 10));
  return <div className="space-y-6">
    <div className="flex items-center gap-4">
      <BackButton />
      <h1 className="text-2xl font-bold text-slate-900">{t("orderSubscriptions", { id })}</h1>
    </div>
    <SubscriptionsList subscriptions={subscriptions} />
  </div>;
}
