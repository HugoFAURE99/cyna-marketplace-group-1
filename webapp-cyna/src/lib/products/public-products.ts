// Server-only data access for the public product detail page + similar products.
import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import {
  compareBySearchOrder,
  sortImages,
  sortTariffs,
} from "@/lib/products/public-catalog";
import type { AutomaticPromotion } from "@/lib/promotions/automatic-promotion";
import { enrichProductsWithAutomaticPromotions } from "@/lib/promotions/automatic-promotions.server";
import type { Tables } from "@/types/database.types";

// Language-neutral product fields that stay on the base row.
type ProductNeutral = Pick<
  Tables<"produit">,
  | "date_ajout"
  | "id_categorie"
  | "id_produit"
  | "is_priorite"
  | "ordre_priorite"
  | "est_disponible"
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
  automaticPromotion: AutomaticPromotion | null;
  id_prix: number;
  nom_prix_tarif: string | null;
  prix: number;
  promotionalPriceCents: number;
  stripe_price_id: string;
  type_facturation: string;
  unite: string | null;
};

export type PublicProductDetail = ProductNeutral & {
  nom_pro: string;
  pro_description: string | null;
  category: PublicProductCategory | null;
  images: PublicProductImage[];
  specs: string[];
  tariffs: PublicProductTariff[];
};

export type SimilarProduct = Pick<
  ProductNeutral,
  "date_ajout" | "est_disponible" | "id_categorie" | "id_produit" | "is_priorite" | "ordre_priorite"
> & {
  nom_pro: string;
  category: PublicProductCategory | null;
  images: PublicProductImage[];
  tariffs: PublicProductTariff[];
};

// Companion (translation) rows embedded alongside their parent.
type ProduitTraductionRow = Pick<
  Tables<"produit_traduction">,
  "langue" | "nom_pro" | "pro_description"
>;

// Technical specs now come from the dedicated (translated, ordered) tables
// rather than the legacy `pro_carac_technique` string column.
type TechnicalCharacteristicQueryRow = Pick<
  Tables<"produit_caracteristique_technique">,
  "ordre_affichage"
> & {
  caracteristique_technique:
    | (Pick<Tables<"caracteristique_technique">, "id_caracteristique"> & {
        caracteristique_technique_traduction:
          | Pick<
              Tables<"caracteristique_technique_traduction">,
              "langue" | "nom_caracteristique"
            >[]
          | null;
      })
    | null;
};

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
  produit_caracteristique_technique: TechnicalCharacteristicQueryRow[] | null;
};

type SimilarProductQueryRow = Pick<
  ProductNeutral,
  "date_ajout" | "est_disponible" | "id_categorie" | "id_produit" | "is_priorite" | "ordre_priorite"
> & {
  produit_traduction: ProduitTraductionRow[] | null;
  categorie: CategoryQueryRow | null;
  image_produit: PublicProductImage[] | null;
  prix_tarif: TariffQueryRow[] | null;
};

const PRODUCT_SELECT = `
  date_ajout,
  id_categorie,
  id_produit,
  is_priorite,
  ordre_priorite,
  est_disponible,
  statut_produit,
  produit_traduction (
    langue,
    nom_pro,
    pro_description
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
  produit_caracteristique_technique (
    ordre_affichage,
    caracteristique_technique (
      id_caracteristique,
      caracteristique_technique_traduction (
        langue,
        nom_caracteristique
      )
    )
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
  id_categorie,
  id_produit,
  is_priorite,
  ordre_priorite,
  est_disponible,
  produit_traduction (
    langue,
    nom_pro,
    pro_description
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

// Build the ordered, translated spec list from the dedicated characteristic
// tables. Missing translations are skipped; ties fall back to name then id.
function resolveSpecs(
  rows: TechnicalCharacteristicQueryRow[] | null,
  locale: Locale,
): string[] {
  return (rows ?? [])
    .map((link) => {
      const characteristic = link.caracteristique_technique;
      const translation = pickTranslation(
        characteristic?.caracteristique_technique_traduction,
        locale,
      );
      const name = translation?.nom_caracteristique?.trim();
      if (!characteristic || !name) {
        return null;
      }
      return {
        id_caracteristique: characteristic.id_caracteristique,
        nom_caracteristique: name,
        ordre_affichage: link.ordre_affichage,
      };
    })
    .filter((spec): spec is NonNullable<typeof spec> => spec !== null)
    .sort(
      (a, b) =>
        a.ordre_affichage - b.ordre_affichage ||
        a.nom_caracteristique.localeCompare(b.nom_caracteristique, locale) ||
        a.id_caracteristique - b.id_caracteristique,
    )
    .map((spec) => spec.nom_caracteristique);
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

  const product = normalizeProduct(data as unknown as ProductQueryRow, locale);
  const [promotedProduct] = await enrichProductsWithAutomaticPromotions([
    product,
  ]);
  return promotedProduct;
}

export async function getSimilarProducts(
  currentProductId: number,
  categoryId: number,
  locale: Locale,
) {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("produit")
    .select(SIMILAR_PRODUCT_SELECT)
    .eq("statut_produit", true)
    .eq("id_categorie", categoryId)
    .neq("id_produit", currentProductId)
    .order("date_ajout", { ascending: false })
    .order("id_produit", { ascending: true });

  if (error) {
    throw new Error(`Erreur chargement produits similaires : ${error.message}`);
  }

  const products = ((data ?? []) as unknown as SimilarProductQueryRow[]).map(
    (row) => normalizeSimilarProduct(row, locale),
  );

  return (await enrichProductsWithAutomaticPromotions(products))
    .sort(compareBySearchOrder)
    .slice(0, 3);
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
    automaticPromotion: null,
    id_prix: row.id_prix,
    nom_prix_tarif: translation?.nom_prix_tarif ?? null,
    prix: row.prix,
    promotionalPriceCents: row.prix,
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

  return {
    date_ajout: row.date_ajout,
    id_categorie: row.id_categorie,
    id_produit: row.id_produit,
    is_priorite: row.is_priorite,
    ordre_priorite: row.ordre_priorite,
    est_disponible: row.est_disponible,
    statut_produit: row.statut_produit,
    nom_pro: translation?.nom_pro ?? "",
    pro_description: translation?.pro_description ?? null,
    category: resolveCategory(row.categorie, locale),
    images: sortImages(row.image_produit ?? []),
    specs: resolveSpecs(row.produit_caracteristique_technique, locale),
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
    id_categorie: row.id_categorie,
    id_produit: row.id_produit,
    is_priorite: row.is_priorite,
    ordre_priorite: row.ordre_priorite,
    est_disponible: row.est_disponible,
    nom_pro: translation?.nom_pro ?? "",
    category: resolveCategory(row.categorie, locale),
    images: sortImages(row.image_produit ?? []),
    tariffs: sortTariffs(
      (row.prix_tarif ?? []).map((tariff) => resolveTariff(tariff, locale)),
    ),
  };
}
