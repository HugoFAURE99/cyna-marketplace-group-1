import { setRequestLocale } from "next-intl/server";

import PromotionForm from "@/components/admin/PromotionForm/PromotionForm";
import {
  getPromotionById,
  getAllProducts,
  getAllCategories,
} from "@/app/[locale]/(admin)/admin/_actions/promotion.actions";
import type { Locale } from "@/lib/i18n/translations";

export default async function EditPromotionPage({
  params,
}: {
  params: Promise<{ id: string; locale: Locale }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  const [promotion, products, categories] = await Promise.all([
    getPromotionById(Number(id)),
    getAllProducts(),
    getAllCategories(),
  ]);

  return (
    <div>
      <PromotionForm
        promotion={promotion}
        allProducts={products}
        allCategories={categories}
      />
    </div>
  );
}
