import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCategories } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import CategoriesTable from "@/components/admin/CategoriesTable/CategoriesTable";

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
      <div className="flex justify-between items-center mb-6">
        <h1>{t("title")}</h1>

        <Link
          href="/admin/categories/new"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2"
        >
          {t("add")}
        </Link>
      </div>
      <CategoriesTable categories={categories} />
    </div>
  );
}
