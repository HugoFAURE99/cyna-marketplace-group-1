import ProductForm from '@/components/admin/ProductForm/ProductForm'
import { getCategories } from '@/app/(admin)/admin/_actions/product.actions'

export default async function NewProductPage() {
  const categories = await getCategories()

  return (
    <div>
      <h1>Nouveau produit</h1>
      <ProductForm categories={categories} />
    </div>
  )
}