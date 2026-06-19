// Shared server-only catalog data access used by the home page, category
// listings, and search. Centralises the product query shape, public search
// ordering, and normalisation so every public listing stays consistent.
import "server-only";

import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  PublicProductImage,
  PublicProductTariff,
} from "@/lib/products/public-products";
import type { Tables } from "@/types/database.types";

// A product as shown in any listing (home, category, search). `description`
// is carried for fuzzy-search matching; cards ignore it.
export type CatalogProduct = {
  id_produit: number;
  nom_pro: string;
  description: string | null;
  is_priorite: boolean;
  mis_avant: boolean;
  mis_avant_ordre: number;
  ordre_priorite: number;
  date_ajout: string;
  quantite_produit: number;
  category: { cat_nom: string; lien_image_cat: string | null } | null;
  technicalCharacteristics: CatalogTechnicalCharacteristic[];
  images: PublicProductImage[];
  tariffs: PublicProductTariff[];
};

export type CatalogTechnicalCharacteristic = {
  id_caracteristique: number;
  nom_caracteristique: string;
  ordre_affichage: number;
};

// Companion (translation) rows embedded alongside their parent.
type CatalogTariffQueryRow = Pick<
  Tables<"prix_tarif">,
  "id_prix" | "prix" | "stripe_price_id" | "type_facturation"
> & {
  prix_tarif_traduction:
    | Pick<Tables<"prix_tarif_traduction">, "langue" | "nom_prix_tarif" | "unite">[]
    | null;
};

type CatalogTechnicalCharacteristicQueryRow = Pick<
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

export type CatalogProductQueryRow = Pick<
  Tables<"produit">,
  | "date_ajout"
  | "id_produit"
  | "is_priorite"
  | "mis_avant"
  | "mis_avant_ordre"
  | "ordre_priorite"
  | "quantite_produit"
> & {
  produit_traduction:
    | Pick<Tables<"produit_traduction">, "langue" | "nom_pro" | "pro_description">[]
    | null;
  categorie:
    | (Pick<Tables<"categorie">, "lien_image_cat"> & {
        categorie_traduction:
          | Pick<Tables<"categorie_traduction">, "langue" | "cat_nom">[]
          | null;
      })
    | null;
  image_produit: PublicProductImage[] | null;
  prix_tarif: CatalogTariffQueryRow[] | null;
  produit_caracteristique_technique:
    | CatalogTechnicalCharacteristicQueryRow[]
    | null;
};

// One select pulls each product with its category, images, and tariffs.
// Adds display-ordering columns + stock and the embedded `pro_description`
// for fuzzy search on top of the card query shape.
export const CATALOG_PRODUCT_SELECT = `
  date_ajout,
  id_produit,
  is_priorite,
  mis_avant,
  mis_avant_ordre,
  ordre_priorite,
  quantite_produit,
  produit_traduction (
    langue,
    nom_pro,
    pro_description
  ),
  categorie (
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

// Sort order for billing types: monthly -> yearly -> one-time.
const BILLING_ORDER: Record<string, number> = {
  mensuel: 0,
  annuel: 1,
  unique: 2,
};

type SearchOrderedProduct = Pick<
  CatalogProduct,
  "date_ajout" | "id_produit" | "is_priorite" | "ordre_priorite" | "quantite_produit"
>;

// Search/catalog ordering: available products first, priority products before
// normal products, then out-of-stock products at the very end.
export function compareBySearchOrder<T extends SearchOrderedProduct>(
  a: T,
  b: T,
) {
  const aAvailable = a.quantite_produit > 0;
  const bAvailable = b.quantite_produit > 0;

  if (aAvailable !== bAvailable) {
    return aAvailable ? -1 : 1;
  }

  if (aAvailable && a.is_priorite !== b.is_priorite) {
    return a.is_priorite ? -1 : 1;
  }

  if (aAvailable && a.is_priorite && a.ordre_priorite !== b.ordre_priorite) {
    return a.ordre_priorite - b.ordre_priorite;
  }

  return (
    b.date_ajout.localeCompare(a.date_ajout) || a.id_produit - b.id_produit
  );
}

export function sortImages(images: PublicProductImage[]) {
  return [...images].sort((a, b) => {
    const aOrder = a.ordre_affichage ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.ordre_affichage ?? Number.MAX_SAFE_INTEGER;

    return aOrder - bOrder || a.id_image - b.id_image;
  });
}

export function sortTariffs(tariffs: PublicProductTariff[]) {
  return [...tariffs].sort((a, b) => {
    const aOrder = BILLING_ORDER[a.type_facturation] ?? Number.MAX_SAFE_INTEGER;
    const bOrder = BILLING_ORDER[b.type_facturation] ?? Number.MAX_SAFE_INTEGER;

    return aOrder - bOrder || a.id_prix - b.id_prix;
  });
}

export function sortTechnicalCharacteristics(
  characteristics: CatalogTechnicalCharacteristic[],
) {
  return [...characteristics].sort((a, b) => {
    return (
      a.ordre_affichage - b.ordre_affichage ||
      a.nom_caracteristique.localeCompare(b.nom_caracteristique) ||
      a.id_caracteristique - b.id_caracteristique
    );
  });
}

export function normalizeCatalogProduct(
  row: CatalogProductQueryRow,
  locale: Locale,
): CatalogProduct {
  const productTranslation = pickTranslation(row.produit_traduction, locale);
  const categoryTranslation = pickTranslation(
    row.categorie?.categorie_traduction,
    locale,
  );

  return {
    id_produit: row.id_produit,
    nom_pro: productTranslation?.nom_pro ?? "",
    description: productTranslation?.pro_description ?? null,
    is_priorite: row.is_priorite,
    mis_avant: row.mis_avant,
    mis_avant_ordre: row.mis_avant_ordre,
    ordre_priorite: row.ordre_priorite,
    date_ajout: row.date_ajout,
    quantite_produit: row.quantite_produit,
    category: row.categorie
      ? {
          cat_nom: categoryTranslation?.cat_nom ?? "",
          lien_image_cat: row.categorie.lien_image_cat,
        }
      : null,
    technicalCharacteristics: sortTechnicalCharacteristics(
      (row.produit_caracteristique_technique ?? [])
        .map((link) => {
          const characteristic = link.caracteristique_technique;
          const translation = pickTranslation(
            characteristic?.caracteristique_technique_traduction,
            locale,
          );

          if (!characteristic || !translation?.nom_caracteristique) {
            return null;
          }

          return {
            id_caracteristique: characteristic.id_caracteristique,
            nom_caracteristique: translation.nom_caracteristique,
            ordre_affichage: link.ordre_affichage,
          };
        })
        .filter(
          (
            characteristic,
          ): characteristic is CatalogTechnicalCharacteristic =>
            characteristic !== null,
        ),
    ),
    images: sortImages(row.image_produit ?? []),
    tariffs: sortTariffs(
      (row.prix_tarif ?? []).map((tariff) => {
        const tariffTranslation = pickTranslation(
          tariff.prix_tarif_traduction,
          locale,
        );

        return {
          id_prix: tariff.id_prix,
          nom_prix_tarif: tariffTranslation?.nom_prix_tarif ?? null,
          prix: tariff.prix,
          stripe_price_id: tariff.stripe_price_id,
          type_facturation: tariff.type_facturation,
          unite: tariffTranslation?.unite ?? null,
        };
      }),
    ),
  };
}

// Active products in search/catalog order. Pass `categoryId` to filter to one
// category (done in SQL); out-of-stock products are kept (they get a badge).
export async function getCatalogProducts(
  locale: Locale,
  categoryId?: number,
): Promise<CatalogProduct[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("produit")
    .select(CATALOG_PRODUCT_SELECT)
    .eq("statut_produit", true);

  if (categoryId !== undefined) {
    query = query.eq("id_categorie", categoryId);
  }

  const { data, error } = await query
    .order("date_ajout", { ascending: false })
    .order("id_produit", { ascending: true });

  if (error) {
    throw new Error(`Erreur chargement catalogue public : ${error.message}`);
  }

  return ((data ?? []) as unknown as CatalogProductQueryRow[])
    .map((row) => normalizeCatalogProduct(row, locale))
    .sort(compareBySearchOrder);
}

// Active products for a set of ids (used by the cart to enrich its lines).
// Returned unordered; callers that need a specific order should sort the result
// themselves (the cart keeps the cookie's line order).
export async function getCatalogProductsByIds(
  ids: number[],
  locale: Locale,
): Promise<CatalogProduct[]> {
  if (ids.length === 0) {
    return [];
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("produit")
    .select(CATALOG_PRODUCT_SELECT)
    .eq("statut_produit", true)
    .in("id_produit", ids);

  if (error) {
    throw new Error(`Erreur chargement produits panier : ${error.message}`);
  }

  return ((data ?? []) as unknown as CatalogProductQueryRow[]).map((row) =>
    normalizeCatalogProduct(row, locale),
  );
}

// Lightweight category list (id + localised name) for the search filters,
// sorted by name in the active locale.
export async function getCatalogCategories(
  locale: Locale,
): Promise<{ id_categorie: number; cat_nom: string }[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("categorie").select(
    `
      id_categorie,
      categorie_traduction (
        langue,
        cat_nom
      )
    `,
  );

  if (error) {
    throw new Error(`Erreur chargement catégories publiques : ${error.message}`);
  }

  type Row = Pick<Tables<"categorie">, "id_categorie"> & {
    categorie_traduction:
      | Pick<Tables<"categorie_traduction">, "langue" | "cat_nom">[]
      | null;
  };

  return ((data ?? []) as unknown as Row[])
    .map((row) => ({
      id_categorie: row.id_categorie,
      cat_nom: pickTranslation(row.categorie_traduction, locale)?.cat_nom ?? "",
    }))
    .sort((a, b) => a.cat_nom.localeCompare(b.cat_nom, locale));
}

export async function getCatalogTechnicalCharacteristics(
  locale: Locale,
): Promise<
  Pick<CatalogTechnicalCharacteristic, "id_caracteristique" | "nom_caracteristique">[]
> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("caracteristique_technique").select(
    `
      id_caracteristique,
      caracteristique_technique_traduction (
        langue,
        nom_caracteristique
      )
    `,
  );

  if (error) {
    throw new Error(
      `Erreur chargement caracteristiques techniques publiques : ${error.message}`,
    );
  }

  type Row = Pick<Tables<"caracteristique_technique">, "id_caracteristique"> & {
    caracteristique_technique_traduction:
      | Pick<
          Tables<"caracteristique_technique_traduction">,
          "langue" | "nom_caracteristique"
        >[]
      | null;
  };

  return ((data ?? []) as unknown as Row[])
    .map((row) => ({
      id_caracteristique: row.id_caracteristique,
      nom_caracteristique:
        pickTranslation(row.caracteristique_technique_traduction, locale)
          ?.nom_caracteristique ?? "",
    }))
    .filter((characteristic) => characteristic.nom_caracteristique.length > 0)
    .sort((a, b) =>
      a.nom_caracteristique.localeCompare(b.nom_caracteristique, locale),
    );
}
