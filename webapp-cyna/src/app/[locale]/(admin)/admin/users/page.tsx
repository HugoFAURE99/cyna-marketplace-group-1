import { getTranslations, setRequestLocale } from "next-intl/server";

import { getUsers } from "@/app/[locale]/(admin)/admin/_actions/user.actions";
import UsersTableClient from "@/components/admin/UsersTable/UsersTableClient";
import type { Locale } from "@/lib/i18n/translations";

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ detail?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tUsers = await getTranslations("admin.users");
  const users = await getUsers();

  const translations = {
    title: tUsers("title"),
    search: tUsers("search"),
    name: tUsers("name"),
    email: tUsers("email"),
    role: tUsers("role"),
    status: tUsers("status"),
    actions: tUsers("actions"),
    active: tUsers("active"),
    inactive: tUsers("inactive"),
    admin: tUsers("admin"),
    user: tUsers("user"),
    delete: tUsers("delete"),
    confirmDeleteTitle: tUsers("confirmDeleteTitle"),
    confirmDeleteMessage: tUsers("confirmDeleteMessage"),
    confirmDelete: tUsers("confirmDelete"),
    cancelDelete: tUsers("cancelDelete"),
    deleting: tUsers("deleting"),
    noUsers: tUsers("noUsers"),
    view: tUsers("view"),
    back: tUsers("back"),
    detailTitle: tUsers("detailTitle"),
    addresses: tUsers("addresses"),
    noAddresses: tUsers("noAddresses"),
    orders: tUsers("orders"),
    noOrders: tUsers("noOrders"),
    subscriptions: tUsers("subscriptions"),
    noSubscriptions: tUsers("noSubscriptions"),
    orderDate: tUsers("orderDate"),
    orderTotal: tUsers("orderTotal"),
    orderStatus: tUsers("orderStatus"),
    subStart: tUsers("subStart"),
    subEnd: tUsers("subEnd"),
    subStatus: tUsers("subStatus"),
    loading: tUsers("loading"),
    viewOrder: tUsers("viewOrder"),
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{translations.title}</h1>
      <UsersTableClient users={users} translations={translations} initialDetailId={(await searchParams).detail} />
    </div>
  );
}
