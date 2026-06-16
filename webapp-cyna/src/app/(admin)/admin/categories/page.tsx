import Link from "next/link";
import { getCategories } from "@/app/(admin)/admin/_actions/category.actions";
import CategoriesTable from "@/components/admin/CategoriesTable/CategoriesTable";
import { Button } from "@/components/ui/button";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div>
        <h1>Catégories</h1>
        <Button nativeButton={false} render={<Link href="./categories/new" />}>
          Ajouter une catégorie
        </Button>
      </div>
      <CategoriesTable categories={categories} />
    </div>
  );
}
