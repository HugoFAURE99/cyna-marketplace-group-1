import { getTranslations, setRequestLocale } from "next-intl/server";

import { getOrders } from "@/app/[locale]/(admin)/admin/_actions/order.actions";
import OrdersTableClient from "@/components/admin/OrdersTable/OrdersTableClient";
import type { Locale } from "@/lib/i18n/translations";

export default async function OrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ detail?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tOrders = await getTranslations("admin.orders");
  const orders = await getOrders();

  const translations = {
    title: tOrders("title"),
    search: tOrders("search"),
    allStatuses: tOrders("allStatuses"),
    statusEnCours: tOrders("statusEnCours"),
    statusPayee: tOrders("statusPayee"),
    statusActive: tOrders("statusActive"),
    statusEchoue: tOrders("statusEchoue"),
    statusExpire: tOrders("statusExpire"),
    orderId: tOrders("orderId"),
    date: tOrders("date"),
    client: tOrders("client"),
    total: tOrders("total"),
    status: tOrders("status"),
    actions: tOrders("actions"),
    noOrders: tOrders("noOrders"),
    view: tOrders("view"),
    back: tOrders("back"),
    detailTitle: tOrders("detailTitle"),
    lineItems: tOrders("lineItems"),
    product: tOrders("product"),
    quantity: tOrders("quantity"),
    unitPrice: tOrders("unitPrice"),
    subtotal: tOrders("subtotal"),
    billingType: tOrders("billingType"),
    promotion: tOrders("promotion"),
    promoType: tOrders("promoType"),
    promoValue: tOrders("promoValue"),
    noPromo: tOrders("noPromo"),
    loading: tOrders("loading"),
    dateFrom: tOrders("dateFrom"),
    dateTo: tOrders("dateTo"),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{translations.title}</h1>
      <OrdersTableClient orders={orders} translations={translations} initialDetailId={(await searchParams).detail} />
    </div>
  );
}
