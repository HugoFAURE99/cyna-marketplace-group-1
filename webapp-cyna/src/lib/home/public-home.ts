// Server-only data access for the public home page
// (carousel, intro text, top products, categories).
import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import type {
  PublicProductImage,
  PublicProductTariff,
} from "@/lib/products/public-products";
import type { Tables } from "@/types/database.types";

export type HomeCarouselSlide = {
  id_image: number;
  lien_image_caroussel: string;
  titre_image: string;
  description_image: string | null;
};

export type HomeCategory = {
  id_categorie: number;
  cat_nom: string;
  cat_description: string | null;
  lien_image_cat: string | null;
};

export type HomeIntroContent = {
  body?: string;
  eyebrow?: string;
  linkLabel?: string;
  title?: string;
};

export type HomeProduct = {
  date_ajout: string;
  id_produit: number;
  nom_pro: string;
  ordre_priorite: number;
  category: { cat_nom: string; lien_image_cat: string | null } | null;
  images: PublicProductImage[];
  tariffs: PublicProductTariff[];
};

// Companion (translation) rows embedded alongside their parent.
type ImageCarrouselTraductionRow = Pick<
  Tables<"image_carrousel_traduction">,
  "langue" | "titre_image" | "description_image"
>;

type CategorieTraductionRow = Pick<
  Tables<"categorie_traduction">,
  "langue" | "cat_nom" | "cat_description"
>;

type ProduitTraductionRow = Pick<
  Tables<"produit_traduction">,
  "langue" | "nom_pro"
>;

type CarouselQueryRow = Pick<
  Tables<"image_carrousel">,
  "id_image" | "lien_image_caroussel"
> & {
  image_carrousel_traduction: ImageCarrouselTraductionRow[] | null;
};

type CategoryQueryRow = Pick<
  Tables<"categorie">,
  "id_categorie" | "lien_image_cat" | "ordre_affichage"
> & {
  categorie_traduction: CategorieTraductionRow[] | null;
};

type HomeProductQueryRow = Pick<
  Tables<"produit">,
  "date_ajout" | "id_produit" | "ordre_priorite"
> & {
  produit_traduction: ProduitTraductionRow[] | null;
  categorie:
    | (Pick<Tables<"categorie">, "lien_image_cat"> & {
        categorie_traduction: Pick<
          Tables<"categorie_traduction">,
          "langue" | "cat_nom"
        >[] | null;
      })
    | null;
  image_produit: PublicProductImage[] | null;
  prix_tarif: HomeTariffQueryRow[] | null;
};

type HomeTariffQueryRow = Pick<
  Tables<"prix_tarif">,
  "id_prix" | "prix" | "stripe_price_id" | "type_facturation"
> & {
  prix_tarif_traduction:
    | Pick<
        Tables<"prix_tarif_traduction">,
        "langue" | "nom_prix_tarif" | "unite"
      >[]
    | null;
};

// One query pulls each product with its category, images, and tariffs.
const HOME_PRODUCT_SELECT = `
  date_ajout,
  id_produit,
  ordre_priorite,
  produit_traduction (
    langue,
    nom_pro
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

// Sort order for billing types: monthly → yearly → one-time.
const BILLING_ORDER: Record<string, number> = {
  mensuel: 0,
  annuel: 1,
  unique: 2,
};

const HOME_INTRO_TEXT_KEYS = {
  body: "home_intro_body",
  eyebrow: "home_intro_eyebrow",
  linkLabel: "home_intro_link_label",
  title: "home_intro_title",
} as const;

export async function getHomeCarouselSlides(
  locale: Locale,
): Promise<HomeCarouselSlide[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("image_carrousel")
    .select(
      `
      id_image,
      lien_image_caroussel,
      image_carrousel_traduction (
        langue,
        titre_image,
        description_image
      )
    `,
    )
    .eq("est_actif", true)
    .order("id_image", { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(`Erreur chargement carousel public : ${error.message}`);
  }

  return ((data ?? []) as unknown as CarouselQueryRow[]).map((slide) => {
    const translation = pickTranslation(
      slide.image_carrousel_traduction,
      locale,
    );

    return {
      id_image: slide.id_image,
      lien_image_caroussel: slide.lien_image_caroussel,
      titre_image: translation?.titre_image ?? "",
      description_image: translation?.description_image ?? null,
    };
  });
}

export async function getHomeIntroContent(
  locale: Locale,
): Promise<HomeIntroContent | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("texte_general")
    .select("emplacement_texte, langue, texte")
    .in("emplacement_texte", Object.values(HOME_INTRO_TEXT_KEYS));

  if (error) {
    throw new Error(`Erreur chargement textes accueil : ${error.message}`);
  }

  // Group rows per placement, then resolve the active locale (fr fallback).
  const rowsByPlacement = new Map<string, typeof data>();
  for (const row of data ?? []) {
    const list = rowsByPlacement.get(row.emplacement_texte) ?? [];
    list.push(row);
    rowsByPlacement.set(row.emplacement_texte, list);
  }

  const resolve = (placement: string) =>
    pickTranslation(rowsByPlacement.get(placement), locale)?.texte.trim() ||
    undefined;

  const content = {
    body: resolve(HOME_INTRO_TEXT_KEYS.body),
    eyebrow: resolve(HOME_INTRO_TEXT_KEYS.eyebrow),
    linkLabel: resolve(HOME_INTRO_TEXT_KEYS.linkLabel),
    title: resolve(HOME_INTRO_TEXT_KEYS.title),
  };

  // Null when nothing is configured, so the intro section can be skipped.
  return content.body || content.eyebrow || content.linkLabel || content.title
    ? content
    : null;
}

export async function getHomeCategories(
  locale: Locale,
): Promise<HomeCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categorie")
    .select(
      `
      id_categorie,
      lien_image_cat,
      ordre_affichage,
      categorie_traduction (
        langue,
        cat_nom,
        cat_description
      )
    `,
    )
    .order("ordre_affichage", { ascending: true, nullsFirst: false })
    .limit(6);

  if (error) {
    throw new Error(`Erreur chargement categories publiques : ${error.message}`);
  }

  return ((data ?? []) as unknown as CategoryQueryRow[])
    .map((category) => {
      const translation = pickTranslation(
        category.categorie_traduction,
        locale,
      );

      return {
        id_categorie: category.id_categorie,
        cat_nom: translation?.cat_nom ?? "",
        cat_description: translation?.cat_description ?? null,
        lien_image_cat: category.lien_image_cat,
      };
    })
    .sort((a, b) => a.cat_nom.localeCompare(b.cat_nom, locale));
}

export async function getHomeTopProducts(
  locale: Locale,
): Promise<HomeProduct[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("produit")
    .select(HOME_PRODUCT_SELECT)
    .eq("statut_produit", true)
    .order("mis_avant", { ascending: false })
    .order("ordre_priorite", { ascending: true })
    .order("date_ajout", { ascending: false })
    .limit(6);

  if (error) {
    throw new Error(`Erreur chargement produits publics : ${error.message}`);
  }

  return ((data ?? []) as unknown as HomeProductQueryRow[]).map((product) => {
    const productTranslation = pickTranslation(
      product.produit_traduction,
      locale,
    );
    const categoryTranslation = pickTranslation(
      product.categorie?.categorie_traduction,
      locale,
    );

    return {
      date_ajout: product.date_ajout,
      id_produit: product.id_produit,
      nom_pro: productTranslation?.nom_pro ?? "",
      ordre_priorite: product.ordre_priorite,
      category: product.categorie
        ? {
            cat_nom: categoryTranslation?.cat_nom ?? "",
            lien_image_cat: product.categorie.lien_image_cat,
          }
        : null,
      images: sortImages(product.image_produit ?? []),
      tariffs: sortTariffs(
        (product.prix_tarif ?? []).map((tariff) => {
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
  });
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
