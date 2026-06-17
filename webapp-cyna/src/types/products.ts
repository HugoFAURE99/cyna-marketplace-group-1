export type Product = {
  id_produit: number;
  nom_pro: string;
  pro_description: string;
  statut_produit: boolean;
  categorie: { cat_nom: string } | null;
  prix_tarif: {
    id_prix: string;
    prix: number;
    stripe_price_id: string;
    type_facturation: string;
  }[];
};
