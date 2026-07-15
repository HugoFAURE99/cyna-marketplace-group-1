import { getTranslations } from "next-intl/server";

import type { getCategories } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import CategoriesTableClient from "@/components/admin/CategoriesTable/CategoriesTableClient";

type Category = Awaited<ReturnType<typeof getCategories>>[number];

export default async function CategoriesTable({
  categories,
}: {
  categories: Category[];
}) {
  const t = await getTranslations("admin.categories.table");
  const tActions = await getTranslations("admin.actions");

  const translations = {
    image: t("image"),
    name: t("name"),
    description: t("description"),
    actions: t("actions"),
    edit: tActions("edit"),
  };

  return (
    <CategoriesTableClient
      categories={categories}
      translations={translations}
    />
  );
}
