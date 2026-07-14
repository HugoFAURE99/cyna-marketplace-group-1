import { getTranslations, setRequestLocale } from "next-intl/server";

import CategoryForm from "@/components/admin/CategoryForm/CategoryForm";
import AdminBackButton from "@/components/admin/AdminBackButton";
import { getCategoryById } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import type { Locale } from "@/lib/i18n/translations";

type PageProps = {
  params: Promise<{ id: string; locale: Locale }>;
};

export default async function CategoryDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.categories");
  const tActions = await getTranslations("admin.actions");
  const category = await getCategoryById(Number(id));

  return (
    <div>
      <AdminBackButton
        className="mb-4"
        href="/admin/categories"
        label={tActions("back")}
      />
      <h1>{t("detail")}</h1>
      <CategoryForm category={category} readOnly />
    </div>
  );
}
