import ProductForm from '@/components/admin/ProductForm/ProductForm'

const CATEGORIES_TEMP = [
  { idcategorie: 1, cat_nom: 'Antivirus' },
  { idcategorie: 2, cat_nom: 'Firewall' },
  { idcategorie: 3, cat_nom: 'VPN' },
]

export default function NewProductPage() {
  return (
    <div>
      <h1>Nouveau produit</h1>
      <ProductForm categories={CATEGORIES_TEMP} />
    </div>
  )
}