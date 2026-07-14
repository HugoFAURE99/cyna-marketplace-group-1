import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductForm from "@/components/admin/ProductForm/ProductForm";
import {
  getProductById,
  getCategories,
  getTechnicalCharacteristics,
} from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import type { Locale } from "@/lib/i18n/translations";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; locale: Locale }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");
  const [product, categories, characteristics] = await Promise.all([
    getProductById(Number(id)),
    getCategories(locale),
    getTechnicalCharacteristics(),
  ]);

  return (
    <div>
      <h1>{t("edit")}</h1>
      <ProductForm product={product} categories={categories} characteristics={characteristics} />
    </div>
  );
}
