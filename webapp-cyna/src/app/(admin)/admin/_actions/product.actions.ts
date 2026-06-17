"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

export async function getCategories() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorie")
    .select("id_categorie, cat_nom")
    .order("cat_nom");

  if (error) {
    throw new Error(`Erreur chargement catégories : ${error.message}`);
  }

  return data ?? [];
}

export async function createProduct(formData: {
  nom_pro: string;
  pro_description: string;
  pro_carac_technique?: string;
  id_categorie: number;
  prix: number;
  type_facturation: "mensuel" | "annuel" | "unique";
}) {
  // 1. Produit Stripe
  const stripeProduct = await stripe.products.create({
    name: formData.nom_pro,
    description: formData.pro_description,
  });

  // 2. Tarif Stripe (montant en centimes) — récurrent sauf paiement unique
  // `prix` est stocké en centimes en base (colonne integer) pour coller à Stripe.
  const prixCentimes = Math.round(formData.prix * 100);

  const stripePrice = await stripe.prices.create({
    product: stripeProduct.id,
    currency: "eur",
    unit_amount: prixCentimes,
    ...(formData.type_facturation === "unique"
      ? {}
      : {
          recurring: {
            interval: formData.type_facturation === "annuel" ? "year" : "month",
          },
        }),
  });

  const supabase = createAdminClient();

  // 3. Ligne produit en base
  const { data: produit, error: produitError } = await supabase
    .from("produit")
    .insert({
      nom_pro: formData.nom_pro,
      pro_description: formData.pro_description,
      pro_carac_technique: formData.pro_carac_technique,
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

  // 4. Tarif en base (porte le stripe_price_id)
  const { error: prixError } = await supabase.from("prix_tarif").insert({
    id_produit: produit.id_produit,
    prix: prixCentimes,
    stripe_price_id: stripePrice.id,
    type_facturation: formData.type_facturation,
  });

  if (prixError) {
    await supabase
      .from("produit")
      .delete()
      .eq("id_produit", produit.id_produit);
    await stripe.products.update(stripeProduct.id, { active: false });
    throw new Error(`Erreur création tarif : ${prixError.message}`);
  }

  revalidatePath("/admin/products");
  return produit;
}

export async function getProducts() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("produit")
    .select(
      `
      id_produit,
      nom_pro,
      pro_description,
      statut_produit,
      categorie (
        cat_nom
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

  return data;
}

export async function getProductById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("produit")
    .select(
      `
      id_produit,
      nom_pro,
      pro_description,
      pro_carac_technique,
      id_categorie,
      stripe_product_id,
      statut_produit,
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

  return data;
}

export async function updateProduct(
  id: number,
  formData: {
    nom_pro: string;
    pro_description: string;
    pro_carac_technique?: string;
    id_categorie: number;
    prix: number;
    type_facturation: "mensuel" | "annuel" | "unique";
  },
) {
  const supabase = createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from("produit")
    .select("stripe_product_id")
    .eq("id_produit", id)
    .single();

  if (existingError || !existing) {
    throw new Error(`Produit introuvable : ${existingError?.message}`);
  }

  if (existing.stripe_product_id) {
    await stripe.products.update(existing.stripe_product_id, {
      name: formData.nom_pro,
      description: formData.pro_description,
    });
  }

  const { error: produitError } = await supabase
    .from("produit")
    .update({
      nom_pro: formData.nom_pro,
      pro_description: formData.pro_description,
      pro_carac_technique: formData.pro_carac_technique,
      id_categorie: formData.id_categorie,
    })
    .eq("id_produit", id);

  if (produitError) {
    throw new Error(`Erreur mise à jour produit : ${produitError.message}`);
  }

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
      currency: "eur",
      unit_amount: prixCentimes,
      ...(formData.type_facturation === "unique"
        ? {}
        : {
            recurring: {
              interval:
                formData.type_facturation === "annuel" ? "year" : "month",
            },
          }),
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

  revalidatePath("/admin/products");
}

export async function deleteProduct(productId: number) {
  const supabase = createAdminClient();

  // Récupère l'id produit Stripe (pour l'archiver après suppression)
  const { data: produit } = await supabase
    .from("produit")
    .select("stripe_product_id")
    .eq("id_produit", productId)
    .single();

  // Supprime d'abord les tarifs (FK), puis le produit
  await supabase.from("prix_tarif").delete().eq("id_produit", productId);

  const { error } = await supabase
    .from("produit")
    .delete()
    .eq("id_produit", productId);

  if (error) {
    throw new Error(`Erreur suppression produit : ${error.message}`);
  }

  // Archive le produit Stripe (ses tarifs deviennent inutilisables du même coup)
  if (produit?.stripe_product_id) {
    await stripe.products.update(produit.stripe_product_id, { active: false });
  }

  revalidatePath("/admin/products");
}
