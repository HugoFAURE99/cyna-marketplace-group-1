import Link from 'next/link'
import { getProducts } from '@/app/(admin)/admin/_actions/product.actions'
import ProductsTable from '@/components/admin/ProductsTable/ProductsTable'
import { Button } from '@/components/ui/button'

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div>
        <h1>Produits</h1>
        <Button nativeButton={false} render={<Link href="./products/new" />}>
          Ajouter un produit
        </Button>
      </div>
      <ProductsTable products={products} />
    </div>
  )
}