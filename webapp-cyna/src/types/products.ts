export type Product = {
    id_produit: number
    nom_pro: string
    pro_description: string
    statut_produit: boolean
    stripe_product_id: string
    categorie: { cat_nom: string } | null
  }