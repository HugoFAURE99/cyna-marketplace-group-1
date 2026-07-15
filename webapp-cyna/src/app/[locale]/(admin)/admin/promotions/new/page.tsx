import { setRequestLocale } from "next-intl/server";

import PromotionForm from "@/components/admin/PromotionForm/PromotionForm";
import {
  getAllProducts,
  getAllCategories,
} from "@/app/[locale]/(admin)/admin/_actions/promotion.actions";
import type { Locale } from "@/lib/i18n/translations";

export default async function NewPromotionPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, categories] = await Promise.all([
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div>
      <PromotionForm allProducts={products} allCategories={categories} />
    </div>
  );
}
