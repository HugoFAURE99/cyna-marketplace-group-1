import ProductForm from '@/components/admin/ProductForm/ProductForm'
import { getProductById, getCategories } from '@/app/(admin)/admin/_actions/product.actions'

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProductById(Number(id)),
    getCategories(),
  ])

  return (
    <div>
      <h1>Modifier le produit</h1>
      <ProductForm product={product} categories={categories} />
    </div>
  )
}
