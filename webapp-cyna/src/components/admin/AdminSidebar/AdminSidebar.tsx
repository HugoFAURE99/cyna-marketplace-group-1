import { getTranslations } from "next-intl/server";
import AdminSidebarClient from "./AdminSidebarClient";

export async function AdminSidebar() {
  const t = await getTranslations("admin.nav");

  const labels = {
    backoffice: t("backoffice"),
    homepage: t("homepage"),
    products: t("products"),
    categories: t("categories"),
    users: t("users"),
    orders: t("orders"),
    subscriptions: t("subscriptions"),
    support: t("support"),
    promotions: t("promotions"),
    sales: t("sales"),
    viewCyna: t("viewCyna"),
    logout: t("logout"),
  };

  return <AdminSidebarClient labels={labels} />;
}
