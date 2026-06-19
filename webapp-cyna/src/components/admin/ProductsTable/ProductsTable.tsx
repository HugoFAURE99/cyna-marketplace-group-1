import { getTranslations } from "next-intl/server";

import type { getProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import ProductsTableClient from "@/components/admin/ProductsTable/ProductsTableClient";

type Product = Awaited<ReturnType<typeof getProducts>>[number];

export default async function ProductsTable({
  products,
}: {
  products: Product[];
}) {
  const t = await getTranslations("admin.products.table");
  const tActions = await getTranslations("admin.actions");

  const translations = {
    image: t("image"),
    name: t("name"),
    category: t("category"),
    status: t("status"),
    priceMonthly: t("priceMonthly"),
    priceAnnual: t("priceAnnual"),
    actions: t("actions"),
    active: t("active"),
    inactive: t("inactive"),
    edit: tActions("edit"),
  };

  return <ProductsTableClient products={products} translations={translations} />;
}
