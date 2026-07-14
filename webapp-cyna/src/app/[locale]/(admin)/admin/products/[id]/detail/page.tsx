import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductForm from "@/components/admin/ProductForm/ProductForm";
import AdminBackButton from "@/components/admin/AdminBackButton";
import {
  getProductById,
  getCategories,
  getTechnicalCharacteristics,
} from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import type { Locale } from "@/lib/i18n/translations";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: Locale }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");
  const tActions = await getTranslations("admin.actions");
  const [product, categories, characteristics] = await Promise.all([
    getProductById(Number(id)),
    getCategories(locale),
    getTechnicalCharacteristics(),
  ]);

  return (
    <div>
      <AdminBackButton
        className="mb-4"
        href="/admin/products"
        label={tActions("back")}
      />
      <h1>{t("detail")}</h1>
      <ProductForm product={product} categories={categories} characteristics={characteristics} readOnly />
    </div>
  );
}
