// Server-only data access for the public home page
// (carousel, intro text, top products, categories).
import "server-only";

import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import {
  CATALOG_PRODUCT_SELECT,
  normalizeCatalogProduct,
  type CatalogProduct,
  type CatalogProductQueryRow,
} from "@/lib/products/public-catalog";
import { createPublicClient } from "@/lib/supabase/public";
import type { Tables } from "@/types/database.types";
import { resolveCarouselContent } from "@/lib/home/home-content";

export type HomeCarouselSlide = {
  buttonHref: string;
  buttonLabel: string;
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
  linkHref?: string;
  title?: string;
};

// Fallback CTA targets used until the matching `texte_general` rows are set.
export const HOME_CAROUSEL_BUTTON_FALLBACK_HREF = "#top-products";
export const HOME_INTRO_LINK_FALLBACK_HREF = "/search";

// Companion (translation) rows embedded alongside their parent.
type ImageCarrouselTraductionRow = Pick<
  Tables<"image_carrousel_traduction">,
  "langue" | "titre_image" | "description_image" | "texte_bouton"
>;

type CategorieTraductionRow = Pick<
  Tables<"categorie_traduction">,
  "langue" | "cat_nom" | "cat_description"
>;

type CarouselQueryRow = Pick<
  Tables<"image_carrousel">,
  "id_image" | "lien_bouton" | "lien_image_caroussel" | "ordre"
> & {
  image_carrousel_traduction: ImageCarrouselTraductionRow[] | null;
};

type CategoryQueryRow = Pick<
  Tables<"categorie">,
  "id_categorie" | "lien_image_cat" | "ordre_affichage"
> & {
  categorie_traduction: CategorieTraductionRow[] | null;
};

const HOME_INTRO_TEXT_KEYS = {
  body: "home_intro_body",
  eyebrow: "home_intro_eyebrow",
  linkLabel: "home_intro_link_label",
  linkHref: "home_intro_link_url",
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
      lien_bouton,
      lien_image_caroussel,
      ordre,
      image_carrousel_traduction (
        langue,
        titre_image,
        description_image,
        texte_bouton
      )
    `,
    )
    .eq("est_actif", true)
    .order("ordre", { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(`Erreur chargement carousel public : ${error.message}`);
  }

  return ((data ?? []) as unknown as CarouselQueryRow[]).map((slide) =>
    resolveCarouselContent(slide, locale, HOME_CAROUSEL_BUTTON_FALLBACK_HREF),
  );
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
    linkHref: resolve(HOME_INTRO_TEXT_KEYS.linkHref),
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
): Promise<CatalogProduct[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("produit")
    .select(CATALOG_PRODUCT_SELECT)
    .eq("statut_produit", true)
    .eq("mis_avant", true)
    .order("mis_avant_ordre", { ascending: true })
    .order("date_ajout", { ascending: false })
    .order("id_produit", { ascending: true })
    .limit(6);

  if (error) {
    throw new Error(`Erreur chargement produits publics : ${error.message}`);
  }

  return ((data ?? []) as unknown as CatalogProductQueryRow[]).map((row) =>
    normalizeCatalogProduct(row, locale),
  );
}
