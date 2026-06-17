import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { getCategories } from "@/app/[locale]/(admin)/admin/_actions/category.actions";
import DeleteCategoryButton from "@/components/admin/CategoriesTable/DeleteCategoryButton";

type Category = Awaited<ReturnType<typeof getCategories>>[number];

export default async function CategoriesTable({
  categories,
}: {
  categories: Category[];
}) {
  const t = await getTranslations("admin.categories.table");
  const tActions = await getTranslations("admin.actions");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("name")}</TableHead>
          <TableHead>{t("description")}</TableHead>
          <TableHead>{t("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id_categorie}>
            <TableCell>{category.cat_nom}</TableCell>
            <TableCell>{category.cat_description ?? "—"}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/admin/categories/${category.id_categorie}`}>
                  {tActions("edit")}
                </Link>
                <DeleteCategoryButton
                  categoryId={category.id_categorie}
                  categoryName={category.cat_nom}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
