import Link from 'next/link'

export default function AdminPage() {
  return (
    <div>
      <h1>Backoffice</h1>
      <Link href="/admin/products">Gérer les produits</Link>
    </div>
  )
}