import { getTranslations, setRequestLocale } from "next-intl/server";

import { getSubscriptions } from "@/app/[locale]/(admin)/admin/_actions/subscription.actions";
import SubscriptionsTableClient from "@/components/admin/SubscriptionsTable/SubscriptionsTableClient";
import type { Locale } from "@/lib/i18n/translations";

export default async function SubscriptionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ detail?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tSub = await getTranslations("admin.subscriptions");
  const subscriptions = await getSubscriptions();

  const translations = {
    title: tSub("title"),
    tabAll: tSub("tabAll"),
    tabExpiring: tSub("tabExpiring"),
    search: tSub("search"),
    allStatuses: tSub("allStatuses"),
    allBillingTypes: tSub("allBillingTypes"),
    id: tSub("id"),
    orderNumber: tSub("orderNumber"),
    client: tSub("client"),
    product: tSub("product"),
    plan: tSub("plan"),
    price: tSub("price"),
    startDate: tSub("startDate"),
    endDate: tSub("endDate"),
    status: tSub("status"),
    actions: tSub("actions"),
    noSubscriptions: tSub("noSubscriptions"),
    view: tSub("view"),
    cancel: tSub("cancel"),
    cancelTitle: tSub("cancelTitle"),
    cancelMessage: tSub("cancelMessage"),
    confirmCancel: tSub("confirmCancel"),
    cancelDeleteBtn: tSub("cancelDeleteBtn"),
    cancelling: tSub("cancelling"),
    bulkCancel: tSub("bulkCancel"),
    bulkCancelTitle: tSub("bulkCancelTitle"),
    bulkCancelMessage: tSub("bulkCancelMessage"),
    selected: tSub("selected"),
    selectAll: tSub("selectAll"),
    back: tSub("back"),
    detailTitle: tSub("detailTitle"),
    linkedOrder: tSub("linkedOrder"),
    viewOrder: tSub("viewOrder"),
    stripeId: tSub("stripeId"),
    noEndDate: tSub("noEndDate"),
    loading: tSub("loading"),
    statusActif: tSub("statusActif"),
    statusAnnule: tSub("statusAnnule"),
    statusExpire: tSub("statusExpire"),
    billingMensuel: tSub("billingMensuel"),
    billingAnnuel: tSub("billingAnnuel"),
    reactivate: tSub("reactivate"),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{translations.title}</h1>
      <SubscriptionsTableClient
        subscriptions={subscriptions}
        translations={translations}
        initialDetailId={(await searchParams).detail}
      />
    </div>
  );
}
