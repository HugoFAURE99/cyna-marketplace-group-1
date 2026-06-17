import { getTranslations, setRequestLocale } from "next-intl/server";

import CategoryForm from "@/components/admin/CategoryForm/CategoryForm";
import { getCategoryById } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import type { Locale } from "@/lib/i18n/translations";

type PageProps = {
  params: Promise<{ id: string; locale: Locale }>;
};

export default async function EditCategoryPage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.categories");
  const category = await getCategoryById(Number(id));

  return (
    <div>
      <h1>{t("edit")}</h1>
      <CategoryForm category={category} />
    </div>
  );
}
