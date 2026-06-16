import CategoryForm from "@/components/admin/CategoryForm/CategoryForm";
import { getCategoryById } from "@/app/(admin)/admin/_actions/category.actions";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = await getCategoryById(Number(id));

  return (
    <div>
      <h1>Modifier la catégorie</h1>
      <CategoryForm category={category} />
    </div>
  );
}
