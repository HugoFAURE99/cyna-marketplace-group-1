import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductForm from "@/components/admin/ProductForm/ProductForm";
import { getCategories, getTechnicalCharacteristics } from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import type { Locale } from "@/lib/i18n/translations";

export default async function NewProductPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");
  const [categories, characteristics] = await Promise.all([
    getCategories(locale),
    getTechnicalCharacteristics(),
  ]);

  return (
    <div>
      <h1>{t("new")}</h1>
      <ProductForm categories={categories} characteristics={characteristics} />
    </div>
  );
}
