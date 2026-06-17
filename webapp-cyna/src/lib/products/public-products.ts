// Server-only data access for the public product detail page + similar products.
import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import type { Tables } from "@/types/database.types";

// Language-neutral product fields that stay on the base row.
type ProductNeutral = Pick<
  Tables<"produit">,
  | "date_ajout"
  | "id_categorie"
  | "id_produit"
  | "ordre_priorite"
  | "statut_produit"
>;

export type PublicProductCategory = {
  id_categorie: number;
  cat_nom: string;
  lien_image_cat: string | null;
};

export type PublicProductImage = Pick<
  Tables<"image_produit">,
  "id_image" | "lien_image_produit" | "ordre_affichage"
>;

export type PublicProductTariff = {
  id_prix: number;
  nom_prix_tarif: string | null;
  prix: number;
  stripe_price_id: string;
  type_facturation: string;
  unite: string | null;
};

export type PublicProductDetail = ProductNeutral & {
  nom_pro: string;
  pro_description: string | null;
  pro_carac_technique: string | null;
  category: PublicProductCategory | null;
  images: PublicProductImage[];
  specs: string[];
  tariffs: PublicProductTariff[];
};

export type SimilarProduct = Pick<
  ProductNeutral,
  "date_ajout" | "id_produit" | "ordre_priorite"
> & {
  nom_pro: string;
  category: PublicProductCategory | null;
  images: PublicProductImage[];
};

// Companion (translation) rows embedded alongside their parent.
type ProduitTraductionRow = Pick<
  Tables<"produit_traduction">,
  "langue" | "nom_pro" | "pro_description" | "pro_carac_technique"
>;

type CategorieTraductionRow = Pick<
  Tables<"categorie_traduction">,
  "langue" | "cat_nom"
>;

type PrixTarifTraductionRow = Pick<
  Tables<"prix_tarif_traduction">,
  "langue" | "nom_prix_tarif" | "unite"
>;

type CategoryQueryRow = Pick<
  Tables<"categorie">,
  "id_categorie" | "lien_image_cat"
> & {
  categorie_traduction: CategorieTraductionRow[] | null;
};

type TariffQueryRow = Pick<
  Tables<"prix_tarif">,
  "id_prix" | "prix" | "stripe_price_id" | "type_facturation"
> & {
  prix_tarif_traduction: PrixTarifTraductionRow[] | null;
};

type ProductQueryRow = ProductNeutral & {
  produit_traduction: ProduitTraductionRow[] | null;
  categorie: CategoryQueryRow | null;
  image_produit: PublicProductImage[] | null;
  prix_tarif: TariffQueryRow[] | null;
};

type SimilarProductQueryRow = Pick<
  ProductNeutral,
  "date_ajout" | "id_produit" | "ordre_priorite"
> & {
  produit_traduction: ProduitTraductionRow[] | null;
  categorie: CategoryQueryRow | null;
  image_produit: PublicProductImage[] | null;
};

const PRODUCT_SELECT = `
  date_ajout,
  id_categorie,
  id_produit,
  ordre_priorite,
  statut_produit,
  produit_traduction (
    langue,
    nom_pro,
    pro_description,
    pro_carac_technique
  ),
  categorie (
    id_categorie,
    lien_image_cat,
    categorie_traduction (
      langue,
      cat_nom
    )
  ),
  image_produit (
    id_image,
    lien_image_produit,
    ordre_affichage
  ),
  prix_tarif (
    id_prix,
    prix,
    stripe_price_id,
    type_facturation,
    prix_tarif_traduction (
      langue,
      nom_prix_tarif,
      unite
    )
  )
`;

const SIMILAR_PRODUCT_SELECT = `
  date_ajout,
  id_produit,
  ordre_priorite,
  produit_traduction (
    langue,
    nom_pro,
    pro_description,
    pro_carac_technique
  ),
  categorie (
    id_categorie,
    lien_image_cat,
    categorie_traduction (
      langue,
      cat_nom
    )
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

export async function getPublicProductById(productId: number, locale: Locale) {
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

  return normalizeProduct(data as unknown as ProductQueryRow, locale);
}

export async function getFeaturedSimilarProducts(
  currentProductId: number,
  locale: Locale,
) {
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

  return ((data ?? []) as unknown as SimilarProductQueryRow[]).map((row) =>
    normalizeSimilarProduct(row, locale),
  );
}

function resolveCategory(
  row: CategoryQueryRow | null,
  locale: Locale,
): PublicProductCategory | null {
  if (!row) {
    return null;
  }

  const translation = pickTranslation(row.categorie_traduction, locale);

  return {
    id_categorie: row.id_categorie,
    cat_nom: translation?.cat_nom ?? "",
    lien_image_cat: row.lien_image_cat,
  };
}

function resolveTariff(
  row: TariffQueryRow,
  locale: Locale,
): PublicProductTariff {
  const translation = pickTranslation(row.prix_tarif_traduction, locale);

  return {
    id_prix: row.id_prix,
    nom_prix_tarif: translation?.nom_prix_tarif ?? null,
    prix: row.prix,
    stripe_price_id: row.stripe_price_id,
    type_facturation: row.type_facturation,
    unite: translation?.unite ?? null,
  };
}

function normalizeProduct(
  row: ProductQueryRow,
  locale: Locale,
): PublicProductDetail {
  const translation = pickTranslation(row.produit_traduction, locale);
  const specs = translation?.pro_carac_technique ?? null;

  return {
    date_ajout: row.date_ajout,
    id_categorie: row.id_categorie,
    id_produit: row.id_produit,
    ordre_priorite: row.ordre_priorite,
    statut_produit: row.statut_produit,
    nom_pro: translation?.nom_pro ?? "",
    pro_description: translation?.pro_description ?? null,
    pro_carac_technique: specs,
    category: resolveCategory(row.categorie, locale),
    images: sortImages(row.image_produit ?? []),
    specs: parseProductSpecs(specs),
    tariffs: sortTariffs(
      (row.prix_tarif ?? []).map((tariff) => resolveTariff(tariff, locale)),
    ),
  };
}

function normalizeSimilarProduct(
  row: SimilarProductQueryRow,
  locale: Locale,
): SimilarProduct {
  const translation = pickTranslation(row.produit_traduction, locale);

  return {
    date_ajout: row.date_ajout,
    id_produit: row.id_produit,
    ordre_priorite: row.ordre_priorite,
    nom_pro: translation?.nom_pro ?? "",
    category: resolveCategory(row.categorie, locale),
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
