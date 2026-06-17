import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCategories } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import CategoriesTable from "@/components/admin/CategoriesTable/CategoriesTable";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/i18n/translations";

export default async function CategoriesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.categories");
  const categories = await getCategories(locale);

  return (
    <div>
      <div>
        <h1>{t("title")}</h1>
        <Button
          nativeButton={false}
          render={<Link href="/admin/categories/new" />}
        >
          {t("add")}
        </Button>
      </div>
      <CategoriesTable categories={categories} />
    </div>
  );
}
