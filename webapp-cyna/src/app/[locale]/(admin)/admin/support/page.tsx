import { getTranslations, setRequestLocale } from "next-intl/server";

import { getTickets } from "@/app/[locale]/(admin)/admin/_actions/ticket.actions";
import SupportTableClient from "@/components/admin/SupportTable/SupportTableClient";
import type { Locale } from "@/lib/i18n/translations";

export default async function SupportPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ detail?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tSupport = await getTranslations("admin.support");
  const tickets = await getTickets();

  const translations = {
    title: tSupport("title"),
    tabNew: tSupport("tabNew"),
    tabUrgent: tSupport("tabUrgent"),
    tabToProcess: tSupport("tabToProcess"),
    tabInProgress: tSupport("tabInProgress"),
    tabClosed: tSupport("tabClosed"),
    search: tSupport("search"),
    allCategories: tSupport("allCategories"),
    id: tSupport("id"),
    subject: tSupport("subject"),
    category: tSupport("category"),
    client: tSupport("client"),
    email: tSupport("email"),
    date: tSupport("date"),
    status: tSupport("status"),
    messages: tSupport("messages"),
    actions: tSupport("actions"),
    noTickets: tSupport("noTickets"),
    view: tSupport("view"),
    markUrgent: tSupport("markUrgent"),
    markToProcess: tSupport("markToProcess"),
    moveInProgress: tSupport("moveInProgress"),
    close: tSupport("close"),
    back: tSupport("back"),
    detailTitle: tSupport("detailTitle"),
    loading: tSupport("loading"),
    description: tSupport("description"),
    order: tSupport("order"),
    viewOrder: tSupport("viewOrder"),
    createdAt: tSupport("createdAt"),
    closedAt: tSupport("closedAt"),
    updatedAt: tSupport("updatedAt"),
    source: tSupport("source"),
    sourceChatbot: tSupport("sourceChatbot"),
    sourceManual: tSupport("sourceManual"),
    customerMessage: tSupport("customerMessage"),
    supportMessage: tSupport("supportMessage"),
    noMessages: tSupport("noMessages"),
    selected: tSupport("selected"),
    selectAll: tSupport("selectAll"),
    bulkUrgent: tSupport("bulkUrgent"),
    bulkToProcess: tSupport("bulkToProcess"),
    bulkInProgress: tSupport("bulkInProgress"),
    bulkClose: tSupport("bulkClose"),
    categoryBilling: tSupport("categoryBilling"),
    categoryOrder: tSupport("categoryOrder"),
    categorySubscription: tSupport("categorySubscription"),
    categoryAccount: tSupport("categoryAccount"),
    categoryTechnical: tSupport("categoryTechnical"),
    categoryOther: tSupport("categoryOther"),
    statusOpen: tSupport("statusOpen"),
    statusUrgent: tSupport("statusUrgent"),
    statusToProcess: tSupport("statusToProcess"),
    statusInProgress: tSupport("statusInProgress"),
    statusClosed: tSupport("statusClosed"),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{translations.title}</h1>
      <SupportTableClient
        tickets={tickets}
        translations={translations}
        initialDetailId={(await searchParams).detail}
      />
    </div>
  );
}
