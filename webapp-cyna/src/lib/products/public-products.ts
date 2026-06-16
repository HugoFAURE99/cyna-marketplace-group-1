// Server-only data access for the public product detail page + similar products.
import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/database.types";

type ProductBase = Pick<
  Tables<"produit">,
  | "date_ajout"
  | "id_categorie"
  | "id_produit"
  | "nom_pro"
  | "ordre_priorite"
  | "pro_carac_technique"
  | "pro_description"
  | "statut_produit"
>;

export type PublicProductCategory = Pick<
  Tables<"categorie">,
  "id_categorie" | "cat_nom" | "lien_image_cat"
>;

export type PublicProductImage = Pick<
  Tables<"image_produit">,
  "id_image" | "lien_image_produit" | "ordre_affichage"
>;

export type PublicProductTariff = Pick<
  Tables<"prix_tarif">,
  | "id_prix"
  | "nom_prix_tarif"
  | "prix"
  | "stripe_price_id"
  | "type_facturation"
  | "unite"
>;

type ProductQueryRow = ProductBase & {
  categorie: PublicProductCategory | null;
  image_produit: PublicProductImage[] | null;
  prix_tarif: PublicProductTariff[] | null;
};

type SimilarProductQueryRow = Pick<
  ProductBase,
  "date_ajout" | "id_produit" | "nom_pro" | "ordre_priorite"
> & {
  categorie: PublicProductCategory | null;
  image_produit: PublicProductImage[] | null;
};

export type PublicProductDetail = ProductBase & {
  category: PublicProductCategory | null;
  images: PublicProductImage[];
  specs: string[];
  tariffs: PublicProductTariff[];
};

export type SimilarProduct = Pick<
  ProductBase,
  "date_ajout" | "id_produit" | "nom_pro" | "ordre_priorite"
> & {
  category: PublicProductCategory | null;
  images: PublicProductImage[];
};

const PRODUCT_SELECT = `
  date_ajout,
  id_categorie,
  id_produit,
  nom_pro,
  ordre_priorite,
  pro_carac_technique,
  pro_description,
  statut_produit,
  categorie (
    id_categorie,
    cat_nom,
    lien_image_cat
  ),
  image_produit (
    id_image,
    lien_image_produit,
    ordre_affichage
  ),
  prix_tarif (
    id_prix,
    nom_prix_tarif,
    prix,
    stripe_price_id,
    type_facturation,
    unite
  )
`;

const SIMILAR_PRODUCT_SELECT = `
  date_ajout,
  id_produit,
  nom_pro,
  ordre_priorite,
  categorie (
    id_categorie,
    cat_nom,
    lien_image_cat
  ),
  image_produit (
    id_image,
    lien_image_produit,
    ordre_affichage
  )
`;

const BILLING_ORDER: Record<string, number> = {
  mensuel: 0,
  annuel: 1,
  unique: 2,
};

// Specs are stored as one ";"-separated string; split into a trimmed list.
export function parseProductSpecs(value: string | null) {
  return (
    value
      ?.split(";")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export async function getPublicProductById(productId: number) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("produit")
    .select(PRODUCT_SELECT)
    .eq("id_produit", productId)
    .eq("statut_produit", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Erreur chargement produit public : ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return normalizeProduct(data as ProductQueryRow);
}

export async function getFeaturedSimilarProducts(currentProductId: number) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("produit")
    .select(SIMILAR_PRODUCT_SELECT)
    .eq("statut_produit", true)
    .eq("mis_avant", true)
    .neq("id_produit", currentProductId)
    .order("ordre_priorite", { ascending: true })
    .order("date_ajout", { ascending: false })
    .limit(3);

  if (error) {
    throw new Error(`Erreur chargement produits similaires : ${error.message}`);
  }

  return ((data ?? []) as SimilarProductQueryRow[]).map(normalizeSimilarProduct);
}

function normalizeProduct(row: ProductQueryRow): PublicProductDetail {
  return {
    date_ajout: row.date_ajout,
    id_categorie: row.id_categorie,
    id_produit: row.id_produit,
    nom_pro: row.nom_pro,
    ordre_priorite: row.ordre_priorite,
    pro_carac_technique: row.pro_carac_technique,
    pro_description: row.pro_description,
    statut_produit: row.statut_produit,
    category: row.categorie,
    images: sortImages(row.image_produit ?? []),
    specs: parseProductSpecs(row.pro_carac_technique),
    tariffs: sortTariffs(row.prix_tarif ?? []),
  };
}

function normalizeSimilarProduct(row: SimilarProductQueryRow): SimilarProduct {
  return {
    date_ajout: row.date_ajout,
    id_produit: row.id_produit,
    nom_pro: row.nom_pro,
    ordre_priorite: row.ordre_priorite,
    category: row.categorie,
    images: sortImages(row.image_produit ?? []),
  };
}

function sortImages(images: PublicProductImage[]) {
  return [...images].sort((a, b) => {
    const aOrder = a.ordre_affichage ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.ordre_affichage ?? Number.MAX_SAFE_INTEGER;

    return aOrder - bOrder || a.id_image - b.id_image;
  });
}

function sortTariffs(tariffs: PublicProductTariff[]) {
  return [...tariffs].sort((a, b) => {
    const aOrder = BILLING_ORDER[a.type_facturation] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = BILLING_ORDER[b.type_facturation] ?? Number.MAX_SAFE_INTEGER;

    return aOrder - bOrder || a.id_prix - b.id_prix;
  });
}
