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
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>

        <Link
          href="/admin/categories/new"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
        >
          {t("add")}
        </Link>
      </div>
      <CategoriesTable categories={categories} />
    </div>
  );
}
