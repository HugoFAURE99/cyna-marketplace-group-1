import { getTranslations, setRequestLocale } from "next-intl/server";

import { getProducts } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import ProductsTable from "@/components/admin/ProductsTable/ProductsTable";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");
  const products = await getProducts(locale);

  return (
    <div>
      <div>
        <h1>{t("title")}</h1>
        <Button nativeButton={false} render={<Link href="/admin/products/new" />}>
          {t("add")}
        </Button>
      </div>
      <ProductsTable products={products} />
    </div>
  );
}
