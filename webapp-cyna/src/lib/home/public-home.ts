// Server-only data access for the public home page
// (carousel, intro text, top products, categories).
import "server-only";

import { createPublicClient } from "@/lib/supabase/public";
import type {
  PublicProductImage,
  PublicProductTariff,
} from "@/lib/products/public-products";
import type { Tables } from "@/types/database.types";

export type HomeCarouselSlide = Pick<
  Tables<"image_carrousel">,
  "description_image" | "id_image" | "lien_image_caroussel" | "titre_image"
>;

export type HomeCategory = Pick<
  Tables<"categorie">,
  "cat_description" | "cat_nom" | "id_categorie" | "lien_image_cat"
>;

export type HomeIntroContent = {
  body?: string;
  eyebrow?: string;
  linkLabel?: string;
  title?: string;
};

export type HomeProduct = Pick<
  Tables<"produit">,
  "date_ajout" | "id_produit" | "nom_pro" | "ordre_priorite"
> & {
  category: Pick<Tables<"categorie">, "cat_nom" | "lien_image_cat"> | null;
  images: PublicProductImage[];
  tariffs: PublicProductTariff[];
};

type HomeProductQueryRow = Pick<
  Tables<"produit">,
  "date_ajout" | "id_produit" | "nom_pro" | "ordre_priorite"
> & {
  categorie: Pick<Tables<"categorie">, "cat_nom" | "lien_image_cat"> | null;
  image_produit: PublicProductImage[] | null;
  prix_tarif: PublicProductTariff[] | null;
};

// One query pulls each product with its category, images, and tariffs.
const HOME_PRODUCT_SELECT = `
  date_ajout,
  id_produit,
  nom_pro,
  ordre_priorite,
  categorie (
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

export async function getHomeCarouselSlides() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("image_carrousel")
    .select("description_image, id_image, lien_image_caroussel, titre_image")
    .eq("est_actif", true)
    .order("id_image", { ascending: true })
    .limit(5);

  if (error) {
    throw new Error(`Erreur chargement carousel public : ${error.message}`);
  }

  return data ?? [];
}

export async function getHomeIntroContent(): Promise<HomeIntroContent | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("texte_general")
    .select("emplacement_texte, texte")
    .in("emplacement_texte", Object.values(HOME_INTRO_TEXT_KEYS));

  if (error) {
    throw new Error(`Erreur chargement textes accueil : ${error.message}`);
  }

  const textByPlacement = new Map(
    (data ?? [])
      .map((row) => [row.emplacement_texte, row.texte.trim()] as const)
      .filter(([, text]) => text.length > 0),
  );

  const content = {
    body: textByPlacement.get(HOME_INTRO_TEXT_KEYS.body),
    eyebrow: textByPlacement.get(HOME_INTRO_TEXT_KEYS.eyebrow),
    linkLabel: textByPlacement.get(HOME_INTRO_TEXT_KEYS.linkLabel),
    title: textByPlacement.get(HOME_INTRO_TEXT_KEYS.title),
  };

  // Null when nothing is configured, so the intro section can be skipped.
  return content.body || content.eyebrow || content.linkLabel || content.title
    ? content
    : null;
}

export async function getHomeCategories() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categorie")
    .select("cat_description, cat_nom, id_categorie, lien_image_cat")
    .order("ordre_affichage", { ascending: true, nullsFirst: false })
    .order("cat_nom", { ascending: true })
    .limit(6);

  if (error) {
    throw new Error(`Erreur chargement categories publiques : ${error.message}`);
  }

  return data ?? [];
}

export async function getHomeTopProducts() {
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

  return ((data ?? []) as HomeProductQueryRow[]).map((product) => ({
    date_ajout: product.date_ajout,
    id_produit: product.id_produit,
    nom_pro: product.nom_pro,
    ordre_priorite: product.ordre_priorite,
    category: product.categorie,
    images: sortImages(product.image_produit ?? []),
    tariffs: sortTariffs(product.prix_tarif ?? []),
  }));
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
