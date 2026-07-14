"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import { routing } from "@/i18n/routing";
import type { TablesInsert } from "@/types/database.types";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_LOCALE = routing.defaultLocale;

// Translatable text is captured per locale by the admin form; everything else
// (price, billing, category, Stripe ids) is language-neutral.
type BillingType = "mensuel" | "annuel";

type ProductFormData = {
  nom_pro_fr: string;
  pro_description_fr: string;
  pro_carac_technique_fr?: string;
  nom_pro_en?: string;
  pro_description_en?: string;
  pro_carac_technique_en?: string;
  id_categorie: number;
  prix_mensuel?: number;
  prix_annuel?: number;
  billings: BillingType[];
  est_disponible?: boolean;
  statut_produit?: boolean;
};

function getPrixForBilling(formData: ProductFormData, billing: BillingType) {
  const prix = billing === "mensuel" ? formData.prix_mensuel : formData.prix_annuel;
  return Math.round((prix ?? 0) * 100);
}

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

function stripePriceArgs(prixCentimes: number, type: BillingType) {
  return {
    currency: "eur",
    unit_amount: prixCentimes,
    recurring: { interval: type === "annuel" ? "year" : "month" },
  } as const;
}

// ── Product image helpers ──────────────────────────────────────────

async function uploadProductImage(
  productId: number,
  file: File,
): Promise<{ url: string }> {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Format de fichier non supporté. Utilisez JPG, PNG ou WebP.",
    );
  }
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("L'image doit faire moins de 2MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const webpBuffer = await sharp(buffer)
    .webp({ quality: 80, effort: 6 })
    .toBuffer();

  const filename = `${uuidv4()}.webp`;
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(`${productId}/${filename}`, webpBuffer, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Erreur d'upload : ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(`${productId}/${filename}`);

  return { url: publicUrlData.publicUrl };
}

async function deleteProductImage(productId: number, filename: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("product-images")
    .remove([`${productId}/${filename}`]);

  if (error) {
    throw new Error(`Erreur suppression image : ${error.message}`);
  }
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

export async function createProduct(
  formData: ProductFormData,
  imageFiles?: File[],
) {
  // 1. Produit Stripe (langue par défaut = fr).
  const stripeProduct = await stripe.products.create({
    name: formData.nom_pro_fr,
    description: formData.pro_description_fr,
  });

  const supabase = createAdminClient();

  // 2. Ligne produit en base.
  const { data: produit, error: produitError } = await supabase
    .from("produit")
    .insert({
      id_categorie: formData.id_categorie,
      est_disponible: formData.est_disponible ?? true,
      stripe_product_id: stripeProduct.id,
      statut_produit: formData.statut_produit ?? false,
    })
    .select("id_produit")
    .single();

  if (produitError) {
    await stripe.products.update(stripeProduct.id, { active: false });
    throw new Error(`Erreur création produit : ${produitError.message}`);
  }

  // 3. Traductions (fr toujours, en si fourni).
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

  // 4. Créer les Stripe Prices en parallèle, puis insérer en base.
  const stripePrices = await Promise.all(
    formData.billings.map((billing) =>
      stripe.prices
        .create({
          product: stripeProduct.id,
          ...stripePriceArgs(getPrixForBilling(formData, billing), billing),
        })
        .then((sp) => ({ billing, stripePrice: sp })),
    ),
  );

  for (const { billing, stripePrice } of stripePrices) {
    const { error: prixError } = await supabase.from("prix_tarif").insert({
      id_produit: produit.id_produit,
      prix: getPrixForBilling(formData, billing),
      stripe_price_id: stripePrice.id,
      type_facturation: billing,
    });

    if (prixError) {
      await supabase
        .from("produit")
        .delete()
        .eq("id_produit", produit.id_produit);
      await stripe.products.update(stripeProduct.id, { active: false });
      throw new Error(`Erreur création tarif : ${prixError.message}`);
    }
  }

  // 5. Upload product images if provided.
  if (imageFiles && imageFiles.length > 0) {
    try {
      const uploadResults = await Promise.all(
        imageFiles.map((file) => uploadProductImage(produit.id_produit, file)),
      );

      const imageRows = uploadResults.map((result, index) => ({
        id_produit: produit.id_produit,
        lien_image_produit: result.url,
        ordre_affichage: index,
      }));

      await supabase.from("image_produit").insert(imageRows);
    } catch (error) {
      console.error("Erreur upload images produit:", error);
    }
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
      est_disponible,
      statut_produit,
      is_priorite,
      ordre_priorite,
      mis_avant,
      mis_avant_ordre,
      id_categorie,
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
      ),
      image_produit (
        lien_image_produit,
        ordre_affichage
      )
    `,
    )
    .order("date_ajout", { ascending: false });

  if (error) {
    throw new Error(`Erreur chargement produits : ${error.message}`);
  }

  return (data ?? []).map((product) => {
    const sortedImages = [...(product.image_produit ?? [])].sort(
      (a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0),
    );
    return {
      id_produit: product.id_produit,
      id_categorie: product.id_categorie,
      statut_produit: product.statut_produit,
      is_priorite: product.is_priorite,
      ordre_priorite: product.ordre_priorite,
      mis_avant: product.mis_avant,
      mis_avant_ordre: product.mis_avant_ordre,
      nom_pro: pickTranslation(product.produit_traduction, locale)?.nom_pro ?? "",
      categorie: product.categorie
        ? {
            cat_nom:
              pickTranslation(product.categorie.categorie_traduction, locale)
                ?.cat_nom ?? "",
          }
        : null,
      prix_tarif: product.prix_tarif,
      image: sortedImages[0]?.lien_image_produit ?? null,
    };
  });
}

export async function getProductById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("produit")
    .select(
      `
      id_produit,
      id_categorie,
      est_disponible,
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
      ),
      image_produit (
        id_image,
        lien_image_produit,
        ordre_affichage
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

  const sortedImages = [...(data.image_produit ?? [])].sort(
    (a, b) => (a.ordre_affichage ?? 0) - (b.ordre_affichage ?? 0),
  );

  return {
    id_produit: data.id_produit,
    id_categorie: data.id_categorie,
    est_disponible: data.est_disponible,
    statut_produit: data.statut_produit,
    prix_tarif: data.prix_tarif,
    image_produit: sortedImages,
    nom_pro_fr: fr?.nom_pro ?? "",
    pro_description_fr: fr?.pro_description ?? "",
    pro_carac_technique_fr: fr?.pro_carac_technique ?? "",
    nom_pro_en: en?.nom_pro ?? "",
    pro_description_en: en?.pro_description ?? "",
    pro_carac_technique_en: en?.pro_carac_technique ?? "",
  };
}

export async function updateProduct(
  id: number,
  formData: ProductFormData,
  imageFiles?: File[],
  removedImageIds?: number[],
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

  // Stripe reste neutre : on envoie le texte de la langue par défaut (fr).
  if (existing.stripe_product_id) {
    await stripe.products.update(existing.stripe_product_id, {
      name: formData.nom_pro_fr,
      description: formData.pro_description_fr,
    });
  }

  const { error: produitError } = await supabase
    .from("produit")
    .update({
      id_categorie: formData.id_categorie,
      est_disponible: formData.est_disponible ?? true,
      statut_produit: formData.statut_produit ?? false,
    })
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

  // Tarifs : reconcilier les lignes existantes avec la sélection.
  const { data: existingTarifs } = await supabase
    .from("prix_tarif")
    .select("id_prix, prix, type_facturation, stripe_price_id")
    .eq("id_produit", id);

  const existingByType = new Map(
    (existingTarifs ?? []).map((t) => [t.type_facturation, t]),
  );

  // Supprimer les tarifs qui ne sont plus sélectionnés (en parallèle).
  const toRemove = [...existingByType.entries()].filter(
    ([type]) => !formData.billings.includes(type as BillingType),
  );
  await Promise.all(
    toRemove.map(async ([, tarif]) => {
      if (tarif.stripe_price_id) {
        await stripe.prices.update(tarif.stripe_price_id, { active: false });
      }
      await supabase.from("prix_tarif").delete().eq("id_prix", tarif.id_prix);
    }),
  );

  // Ajouter ou mettre à jour les tarifs sélectionnés (Stripe en parallèle).
  const toUpsert = formData.billings
    .map((billing) => {
      const prixCentimes = getPrixForBilling(formData, billing);
      const existing_tarif = existingByType.get(billing);
      if (!existing_tarif) return { billing, prixCentimes, mode: "create" as const };
      if (existing_tarif.prix !== prixCentimes)
        return { billing, prixCentimes, mode: "update" as const, id_prix: existing_tarif.id_prix };
      return null;
    })
    .filter((x) => x !== null);

  const newStripePrices = await Promise.all(
    toUpsert.map((item) =>
      stripe.prices
        .create({
          product: existing.stripe_product_id!,
          ...stripePriceArgs(item.prixCentimes, item.billing),
        })
        .then((sp) => ({ ...item, stripe_price_id: sp.id })),
    ),
  );

  for (const item of newStripePrices) {
    if (item.mode === "create") {
      await supabase.from("prix_tarif").insert({
        id_produit: id,
        prix: item.prixCentimes,
        stripe_price_id: item.stripe_price_id,
        type_facturation: item.billing,
      });
    } else {
      await supabase
        .from("prix_tarif")
        .update({ prix: item.prixCentimes, stripe_price_id: item.stripe_price_id })
        .eq("id_prix", item.id_prix!);
    }
  }

  // ── Handle product images ──────────────────────────────────────
  // Delete removed images
  if (removedImageIds && removedImageIds.length > 0) {
    const { data: imagesToRemove } = await supabase
      .from("image_produit")
      .select("id_image, lien_image_produit")
      .in("id_image", removedImageIds);

    if (imagesToRemove) {
      await Promise.all(
        imagesToRemove.map(async (img) => {
          const urlParts = img.lien_image_produit.split("/");
          const filename = urlParts[urlParts.length - 1];
          try {
            await deleteProductImage(id, filename);
          } catch {}
          await supabase
            .from("image_produit")
            .delete()
            .eq("id_image", img.id_image);
        }),
      );
    }
  }

  // Upload new images
  if (imageFiles && imageFiles.length > 0) {
    // Find the max existing ordre_affichage
    const { data: existingImages } = await supabase
      .from("image_produit")
      .select("ordre_affichage")
      .eq("id_produit", id)
      .order("ordre_affichage", { ascending: false })
      .limit(1);

    const maxOrder =
      existingImages && existingImages.length > 0
        ? (existingImages[0].ordre_affichage ?? -1) + 1
        : 0;

    try {
      const uploadResults = await Promise.all(
        imageFiles.map((file) => uploadProductImage(id, file)),
      );

      const imageRows = uploadResults.map((result, index) => ({
        id_produit: id,
        lien_image_produit: result.url,
        ordre_affichage: maxOrder + index,
      }));

      await supabase.from("image_produit").insert(imageRows);
    } catch (error) {
      console.error("Erreur upload images produit:", error);
    }
  }

  revalidatePath("/[locale]/admin/products", "page");
}

export async function toggleProductStatus(id: number, active: boolean) {
  const supabase = createAdminClient();

  const updates = active
    ? { statut_produit: true }
    : { statut_produit: false, mis_avant: false, mis_avant_ordre: 0, is_priorite: false };

  const { error } = await supabase
    .from("produit")
    .update(updates)
    .eq("id_produit", id);

  if (error) {
    throw new Error(`Erreur mise à jour statut : ${error.message}`);
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

export async function deleteProducts(ids: number[]) {
  const results = await Promise.allSettled(ids.map((id) => deleteProduct(id)));

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} produit(s) n'ont pas pu être supprimés.`,
    );
  }
}

export async function bulkToggleProductStatus(ids: number[], active: boolean) {
  const supabase = createAdminClient();

  const results = await Promise.allSettled(
    ids.map((id) =>
      supabase
        .from("produit")
        .update({ statut_produit: active })
        .eq("id_produit", id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} produit(s) n'ont pas pu être mis à jour.`,
    );
  }

  revalidatePath("/[locale]/admin/products", "page");
}

export async function toggleProductPriority(id: number, priority: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("produit")
    .update({ is_priorite: priority })
    .eq("id_produit", id);
  if (error) throw new Error(`Erreur mise à jour priorité : ${error.message}`);
  revalidatePath("/[locale]/admin/products", "page");
}

export async function bulkToggleProductPriority(
  ids: number[],
  priority: boolean,
) {
  const supabase = createAdminClient();
  const results = await Promise.allSettled(
    ids.map((id) =>
      supabase
        .from("produit")
        .update({ is_priorite: priority })
        .eq("id_produit", id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );
  const bulkFailures = results.filter((r) => r.status === "rejected");
  if (bulkFailures.length > 0)
    throw new Error(
      `${bulkFailures.length} produit(s) n'ont pas pu être mis à jour.`,
    );
  revalidatePath("/[locale]/admin/products", "page");
}

export async function updatePriorityOrder(
  items: { id: number; ordre: number }[],
) {
  const supabase = createAdminClient();
  const results = await Promise.allSettled(
    items.map(({ id, ordre }) =>
      supabase
        .from("produit")
        .update({ ordre_priorite: ordre })
        .eq("id_produit", id)
        .then(({ error }) => {
          if (error) throw error;
        }),
    ),
  );
  const orderFailures = results.filter((r) => r.status === "rejected");
  if (orderFailures.length > 0)
    throw new Error(`Erreur mise à jour de l'ordre des priorités.`);
  revalidatePath("/[locale]/admin/products", "page");
}

export async function updateFeaturedProducts(
  items: { id: number; ordre: number }[],
) {
  const supabase = createAdminClient();

  const { error: clearError } = await supabase
    .from("produit")
    .update({ mis_avant: false, mis_avant_ordre: 0 })
    .eq("mis_avant", true);
  if (clearError)
    throw new Error(`Erreur réinitialisation mis en avant : ${clearError.message}`);

  if (items.length > 0) {
    const results = await Promise.allSettled(
      items.map(({ id, ordre }) =>
        supabase
          .from("produit")
          .update({ mis_avant: true, mis_avant_ordre: ordre })
          .eq("id_produit", id)
          .then(({ error }) => {
            if (error) throw error;
          }),
      ),
    );
    const featuredFailures = results.filter((r) => r.status === "rejected");
    if (featuredFailures.length > 0)
      throw new Error(`Erreur mise à jour des produits mis en avant.`);
  }

  revalidatePath("/[locale]/admin/products", "page");
}
