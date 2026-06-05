import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { getProducts } from '@/app/(admin)/admin/_actions/product.actions'
import DeleteProductButton from '@/components/admin/ProductsTable/DeleteProductButton'

type Product = Awaited<ReturnType<typeof getProducts>>[number]

export default function ProductsTable({ products }: { products: Product[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nom</TableHead>
          <TableHead>Catégorie</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Stripe ID</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id_produit}>
            <TableCell>{product.nom_pro}</TableCell>
            <TableCell>{(product.categorie as { cat_nom: string } | null)?.cat_nom ?? '—'}</TableCell>
            <TableCell>{product.statut_produit ? 'Actif' : 'Inactif'}</TableCell>
            <TableCell>{product.stripe_product_id}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Link href={`/admin/products/${product.id_produit}`}>
                  Modifier
                </Link>
                <DeleteProductButton
                  productId={product.id_produit}
                  productName={product.nom_pro}
                />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}