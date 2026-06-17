"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import { routing } from "@/i18n/routing";
import type { TablesInsert } from "@/types/database.types";

const DEFAULT_LOCALE = routing.defaultLocale;

// Translatable text is captured per locale by the admin form; everything else
// (price, billing, category, Stripe ids) is language-neutral.
type ProductFormData = {
  nom_pro_fr: string;
  pro_description_fr: string;
  pro_carac_technique_fr?: string;
  nom_pro_en?: string;
  pro_description_en?: string;
  pro_carac_technique_en?: string;
  id_categorie: number;
  prix: number;
  type_facturation: "mensuel" | "annuel" | "unique";
};

function buildTranslationRows(
  id_produit: number,
  formData: ProductFormData,
): TablesInsert<"produit_traduction">[] {
  const rows: TablesInsert<"produit_traduction">[] = [
    {
      id_produit,
      langue: "fr",
      nom_pro: formData.nom_pro_fr,
      pro_description: formData.pro_description_fr || null,
      pro_carac_technique: formData.pro_carac_technique_fr || null,
    },
  ];

  if (formData.nom_pro_en && formData.nom_pro_en.trim().length > 0) {
    rows.push({
      id_produit,
      langue: "en",
      nom_pro: formData.nom_pro_en,
      pro_description: formData.pro_description_en || null,
      pro_carac_technique: formData.pro_carac_technique_en || null,
    });
  }

  return rows;
}

function stripePriceArgs(
  prixCentimes: number,
  type: ProductFormData["type_facturation"],
) {
  if (type === "unique") {
    return { currency: "eur", unit_amount: prixCentimes } as const;
  }

  return {
    currency: "eur",
    unit_amount: prixCentimes,
    recurring: { interval: type === "annuel" ? "year" : "month" },
  } as const;
}

export async function getCategories(locale: Locale = DEFAULT_LOCALE) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorie")
    .select("id_categorie, categorie_traduction ( langue, cat_nom )");

  if (error) {
    throw new Error(`Erreur chargement catégories : ${error.message}`);
  }

  return (data ?? [])
    .map((cat) => ({
      id_categorie: cat.id_categorie,
      cat_nom: pickTranslation(cat.categorie_traduction, locale)?.cat_nom ?? "",
    }))
    .sort((a, b) => a.cat_nom.localeCompare(b.cat_nom, locale));
}

export async function createProduct(formData: ProductFormData) {
  // 1. Produit Stripe (langue par défaut = fr).
  const stripeProduct = await stripe.products.create({
    name: formData.nom_pro_fr,
    description: formData.pro_description_fr,
  });

  // 2. Tarif Stripe (montant en centimes) — récurrent sauf paiement unique.
  const prixCentimes = Math.round(formData.prix * 100);
  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    ...stripePriceArgs(prixCentimes, formData.type_facturation),
  });

  const supabase = createAdminClient();

  // 3. Ligne produit en base (colonnes neutres uniquement).
  const { data: produit, error: produitError } = await supabase
    .from("produit")
    .insert({
      id_categorie: formData.id_categorie,
      stripe_product_id: stripeProduct.id,
      statut_produit: false,
    })
    .select("id_produit")
    .single();

  if (produitError) {
    await stripe.products.update(stripeProduct.id, { active: false });
    throw new Error(`Erreur création produit : ${produitError.message}`);
  }

  // 4. Traductions (fr toujours, en si fourni).
  const { error: traductionError } = await supabase
    .from("produit_traduction")
    .insert(buildTranslationRows(produit.id_produit, formData));

  if (traductionError) {
    await supabase.from("produit").delete().eq("id_produit", produit.id_produit);
    await stripe.products.update(stripeProduct.id, { active: false });
    throw new Error(
      `Erreur création traductions produit : ${traductionError.message}`,
    );
  }

  // 5. Tarif en base (porte le stripe_price_id).
  const { error: prixError } = await supabase.from("prix_tarif").insert({
    id_produit: produit.id_produit,
    prix: prixCentimes,
    stripe_price_id: stripePrice.id,
    type_facturation: formData.type_facturation,
  });

  if (prixError) {
    // Supprimer le produit retire aussi ses traductions (FK on delete cascade).
    await supabase.from("produit").delete().eq("id_produit", produit.id_produit);
    await stripe.products.update(stripeProduct.id, { active: false });
    throw new Error(`Erreur création tarif : ${prixError.message}`);
  }

  revalidatePath("/[locale]/admin/products", "page");
  return produit;
}

export async function getProducts(locale: Locale = DEFAULT_LOCALE) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("produit")
    .select(
      `
      id_produit,
      statut_produit,
      produit_traduction (
        langue,
        nom_pro
      ),
      categorie (
        categorie_traduction (
          langue,
          cat_nom
        )
      ),
      prix_tarif (
        id_prix,
        prix,
        stripe_price_id,
        type_facturation
      )
    `,
    )
    .order("date_ajout", { ascending: false });

  if (error) {
    throw new Error(`Erreur chargement produits : ${error.message}`);
  }

  return (data ?? []).map((product) => ({
    id_produit: product.id_produit,
    statut_produit: product.statut_produit,
    nom_pro: pickTranslation(product.produit_traduction, locale)?.nom_pro ?? "",
    categorie: product.categorie
      ? {
          cat_nom:
            pickTranslation(product.categorie.categorie_traduction, locale)
              ?.cat_nom ?? "",
        }
      : null,
    prix_tarif: product.prix_tarif,
  }));
}

export async function getProductById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("produit")
    .select(
      `
      id_produit,
      id_categorie,
      stripe_product_id,
      statut_produit,
      produit_traduction (
        langue,
        nom_pro,
        pro_description,
        pro_carac_technique
      ),
      prix_tarif (
        id_prix,
        prix,
        stripe_price_id,
        type_facturation
      )
    `,
    )
    .eq("id_produit", id)
    .single();

  if (error) {
    throw new Error(`Erreur chargement produit : ${error.message}`);
  }

  const fr = data.produit_traduction.find((row) => row.langue === "fr");
  const en = data.produit_traduction.find((row) => row.langue === "en");

  // Flatten to the fr/en fields the form edits.
  return {
    id_produit: data.id_produit,
    id_categorie: data.id_categorie,
    prix_tarif: data.prix_tarif,
    nom_pro_fr: fr?.nom_pro ?? "",
    pro_description_fr: fr?.pro_description ?? "",
    pro_carac_technique_fr: fr?.pro_carac_technique ?? "",
    nom_pro_en: en?.nom_pro ?? "",
    pro_description_en: en?.pro_description ?? "",
    pro_carac_technique_en: en?.pro_carac_technique ?? "",
  };
}

export async function updateProduct(id: number, formData: ProductFormData) {
  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("produit")
    .select("stripe_product_id")
    .eq("id_produit", id)
    .single();

  if (existingError || !existing) {
    throw new Error(`Produit introuvable : ${existingError?.message}`);
  }

  // Stripe reste neutre : on envoie le texte de la langue par défaut (fr).
  if (existing.stripe_product_id) {
    await stripe.products.update(existing.stripe_product_id, {
      name: formData.nom_pro_fr,
      description: formData.pro_description_fr,
    });
  }

  const { error: produitError } = await supabase
    .from("produit")
    .update({ id_categorie: formData.id_categorie })
    .eq("id_produit", id);

  if (produitError) {
    throw new Error(`Erreur mise à jour produit : ${produitError.message}`);
  }

  // Traduction fr (upsert), en (upsert si fourni, sinon suppression).
  const { error: frError } = await supabase.from("produit_traduction").upsert(
    {
      id_produit: id,
      langue: "fr",
      nom_pro: formData.nom_pro_fr,
      pro_description: formData.pro_description_fr || null,
      pro_carac_technique: formData.pro_carac_technique_fr || null,
    },
    { onConflict: "id_produit,langue" },
  );

  if (frError) {
    throw new Error(`Erreur mise à jour traduction fr : ${frError.message}`);
  }

  if (formData.nom_pro_en && formData.nom_pro_en.trim().length > 0) {
    const { error: enError } = await supabase.from("produit_traduction").upsert(
      {
        id_produit: id,
        langue: "en",
        nom_pro: formData.nom_pro_en,
        pro_description: formData.pro_description_en || null,
        pro_carac_technique: formData.pro_carac_technique_en || null,
      },
      { onConflict: "id_produit,langue" },
    );

    if (enError) {
      throw new Error(`Erreur mise à jour traduction en : ${enError.message}`);
    }
  } else {
    await supabase
      .from("produit_traduction")
      .delete()
      .eq("id_produit", id)
      .eq("langue", "en");
  }

  // Tarif : nouveau prix Stripe seulement si le prix ou la facturation change.
  const prixCentimes = Math.round(formData.prix * 100);
  const { data: existingTarif } = await supabase
    .from("prix_tarif")
    .select("id_prix, prix, type_facturation")
    .eq("id_produit", id)
    .single();

  if (
    existingTarif &&
    (existingTarif.prix !== prixCentimes ||
      existingTarif.type_facturation !== formData.type_facturation)
  ) {
    const stripePrice = await stripe.prices.create({
      product: existing.stripe_product_id!,
      ...stripePriceArgs(prixCentimes, formData.type_facturation),
    });

    const { error: prixError } = await supabase
      .from("prix_tarif")
      .update({
        prix: prixCentimes,
        stripe_price_id: stripePrice.id,
        type_facturation: formData.type_facturation,
      })
      .eq("id_prix", existingTarif.id_prix);

    if (prixError) {
      throw new Error(`Erreur mise à jour tarif : ${prixError.message}`);
    }
  }

  revalidatePath("/[locale]/admin/products", "page");
}

export async function deleteProduct(productId: number) {
  const supabase = createAdminClient();

  // Récupère l'id produit Stripe (pour l'archiver après suppression).
  const { data: produit } = await supabase
    .from("produit")
    .select("stripe_product_id")
    .eq("id_produit", productId)
    .single();

  // Supprime d'abord les tarifs (FK), puis le produit (traductions en cascade).
  await supabase.from("prix_tarif").delete().eq("id_produit", productId);

  const { error } = await supabase
    .from("produit")
    .delete()
    .eq("id_produit", productId);

  if (error) {
    throw new Error(`Erreur suppression produit : ${error.message}`);
  }

  // Archive le produit Stripe (ses tarifs deviennent inutilisables du même coup).
  if (produit?.stripe_product_id) {
    await stripe.products.update(produit.stripe_product_id, { active: false });
  }

  revalidatePath("/[locale]/admin/products", "page");
}
