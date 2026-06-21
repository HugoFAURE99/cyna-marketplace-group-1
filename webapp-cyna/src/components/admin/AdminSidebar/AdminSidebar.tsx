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
    sales: t("sales"),
  };

  return <AdminSidebarClient labels={labels} />;
}
