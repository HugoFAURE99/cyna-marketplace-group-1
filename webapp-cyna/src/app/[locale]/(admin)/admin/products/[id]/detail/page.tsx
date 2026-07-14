import { getTranslations, setRequestLocale } from "next-intl/server";

import ProductForm from "@/components/admin/ProductForm/ProductForm";
import {
  getProductById,
  getCategories,
  getTechnicalCharacteristics,
} from "@/app/[locale]/(admin)/admin/_actions/product.actions";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
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
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        {tActions("back")}
      </Link>
      <h1>{t("detail")}</h1>
      <ProductForm product={product} categories={categories} characteristics={characteristics} readOnly />
    </div>
  );
}
