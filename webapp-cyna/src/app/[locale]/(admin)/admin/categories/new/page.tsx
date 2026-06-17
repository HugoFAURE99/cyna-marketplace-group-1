import { getTranslations, setRequestLocale } from "next-intl/server";

import CategoryForm from "@/components/admin/CategoryForm/CategoryForm";
import type { Locale } from "@/lib/i18n/translations";

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.categories");

  return (
    <div>
      <h1>{t("new")}</h1>
      <CategoryForm />
    </div>
  );
}
