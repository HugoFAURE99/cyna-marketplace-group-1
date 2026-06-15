import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { getCategories } from '@/app/(admin)/admin/_actions/category.actions'
import DeleteCategoryButton from '@/components/admin/CategoriesTable/DeleteCategoryButton'

type Category = Awaited<ReturnType<typeof getCategories>>[number]

export default function CategoriesTable({ categories }: { categories: Category[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.id_categorie}>
            <TableCell>{category.cat_nom}</TableCell>
            <TableCell>{category.cat_description ?? '—'}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/admin/categories/${category.id_categorie}`}>
                  Modifier
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
  )
}
