"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import { routing } from "@/i18n/routing";
import type { TablesInsert } from "@/types/database.types";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_LOCALE = routing.defaultLocale;

type CategoryFormData = {
  cat_nom_fr: string;
  cat_description_fr?: string;
  cat_nom_en?: string;
  cat_description_en?: string;
};

function buildTranslationRows(
  id_categorie: number,
  formData: CategoryFormData,
): TablesInsert<"categorie_traduction">[] {
  const rows: TablesInsert<"categorie_traduction">[] = [
    {
      id_categorie,
      langue: "fr",
      cat_nom: formData.cat_nom_fr,
      cat_description: formData.cat_description_fr || null,
    },
  ];

  if (formData.cat_nom_en && formData.cat_nom_en.trim().length > 0) {
    rows.push({
      id_categorie,
      langue: "en",
      cat_nom: formData.cat_nom_en,
      cat_description: formData.cat_description_en || null,
    });
  }

  return rows;
}

export async function getCategories(locale: Locale = DEFAULT_LOCALE) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorie")
    .select(
      "id_categorie, categorie_traduction ( langue, cat_nom, cat_description ), lien_image_cat",
    );

  if (error) {
    throw new Error(`Erreur chargement catégories : ${error.message}`);
  }

  return (data ?? [])
    .map((cat) => {
      const translation = pickTranslation(cat.categorie_traduction, locale);
      return {
        id_categorie: cat.id_categorie,
        cat_nom: translation?.cat_nom ?? "",
        cat_description: translation?.cat_description ?? null,
        lien_image_cat: cat.lien_image_cat || null,
      };
    })
    .sort((a, b) => a.cat_nom.localeCompare(b.cat_nom, locale));
}

export async function createCategory(
  formData: CategoryFormData,
  imageFile?: File | null,
) {
  const supabase = createAdminClient();

  // 1. Création de la catégorie (sans image d'abord)
  const { data: categorie, error: categorieError } = await supabase
    .from("categorie")
    .insert({})
    .select("id_categorie")
    .single();

  if (categorieError) {
    throw new Error(`Erreur création catégorie : ${categorieError.message}`);
  }

  // 2. Traductions (fr toujours, en si fourni)
  const { error: traductionError } = await supabase
    .from("categorie_traduction")
    .insert(buildTranslationRows(categorie.id_categorie, formData));

  if (traductionError) {
    await supabase
      .from("categorie")
      .delete()
      .eq("id_categorie", categorie.id_categorie);
    throw new Error(
      `Erreur création traductions catégorie : ${traductionError.message}`,
    );
  }

  // 3. Upload d'image si fourni (MAINTENANT AVEC L'ID)
  if (imageFile) {
    try {
      const result = await uploadCategoryImage(
        categorie.id_categorie,
        imageFile,
      );
      await updateCategoryImage(categorie.id_categorie, result.url);
    } catch (error) {
      console.error("Erreur upload image:", error);
      // On ne bloque pas la création si l'upload échoue
    }
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/admin/categories`, "page");
  }
  return categorie;
}

export async function getCategoryById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorie")
    .select(
      "id_categorie, categorie_traduction ( langue, cat_nom, cat_description ), lien_image_cat",
    )
    .eq("id_categorie", id)
    .single();

  if (error) {
    throw new Error(`Erreur chargement catégorie : ${error.message}`);
  }

  const fr = data.categorie_traduction.find((row) => row.langue === "fr");
  const en = data.categorie_traduction.find((row) => row.langue === "en");

  return {
    id_categorie: data.id_categorie,
    cat_nom_fr: fr?.cat_nom ?? "",
    cat_description_fr: fr?.cat_description ?? "",
    cat_nom_en: en?.cat_nom ?? "",
    cat_description_en: en?.cat_description ?? "",
    lien_image_cat: data.lien_image_cat || null,
  };
}

export async function updateCategory(
  id: number,
  formData: CategoryFormData,
  imageFile?: File | null,
) {
  const supabase = createAdminClient();

  // 1. Mise à jour des traductions
  const { error: frError } = await supabase.from("categorie_traduction").upsert(
    {
      id_categorie: id,
      langue: "fr",
      cat_nom: formData.cat_nom_fr,
      cat_description: formData.cat_description_fr || null,
    },
    { onConflict: "id_categorie,langue" },
  );

  if (frError) {
    throw new Error(`Erreur mise à jour traduction fr : ${frError.message}`);
  }

  if (formData.cat_nom_en && formData.cat_nom_en.trim().length > 0) {
    const { error: enError } = await supabase
      .from("categorie_traduction")
      .upsert(
        {
          id_categorie: id,
          langue: "en",
          cat_nom: formData.cat_nom_en,
          cat_description: formData.cat_description_en || null,
        },
        { onConflict: "id_categorie,langue" },
      );

    if (enError) {
      throw new Error(`Erreur mise à jour traduction en : ${enError.message}`);
    }
  } else {
    await supabase
      .from("categorie_traduction")
      .delete()
      .eq("id_categorie", id)
      .eq("langue", "en");
  }

  // 2. Upload d'image si fourni
  if (imageFile) {
    const { data: existingData } = await supabase
      .from("categorie")
      .select("lien_image_cat")
      .eq("id_categorie", id)
      .single();

    const result = await uploadCategoryImage(id, imageFile);
    await updateCategoryImage(id, result.url);

    if (existingData?.lien_image_cat) {
      const urlParts = existingData.lien_image_cat.split("/");
      const oldFilename = urlParts[urlParts.length - 1];
      try {
        await deleteCategoryImage(oldFilename, id);
      } catch {}
    }
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/admin/categories`, "page");
  }
  return { id_categorie: id };
}

export async function deleteCategory(id: number) {
  const supabase = createAdminClient();

  // 1. Vérification que la catégorie n'est pas utilisée par des produits.
  const { count, error: countError } = await supabase
    .from("produit")
    .select("id_produit", { count: "exact" })
    .eq("id_categorie", id);

  if (countError) {
    throw new Error(`Erreur vérification catégorie : ${countError.message}`);
  }

  if (count && count > 0) {
    throw new Error(
      "Impossible de supprimer une catégorie utilisée par des produits",
    );
  }

  // 2. Supprimer l'image si elle existe
  const { data: categoryData } = await supabase
    .from("categorie")
    .select("lien_image_cat")
    .eq("id_categorie", id)
    .single();

  if (categoryData?.lien_image_cat) {
    try {
      const urlParts = categoryData.lien_image_cat.split("/");
      const filename = urlParts[urlParts.length - 1];

      await deleteCategoryImage(filename, id);
    } catch (error) {
      console.error("Erreur suppression image avant deletion:", error);
    }
  }

  // 3. Suppression de la catégorie (traductions en cascade).
  const { error } = await supabase
    .from("categorie")
    .delete()
    .eq("id_categorie", id);

  if (error) {
    throw new Error(`Erreur suppression catégorie : ${error.message}`);
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/admin/categories`, "page");
  }
}

export async function deleteCategories(ids: number[]) {
  const supabase = createAdminClient();

  // Check which categories are used by products
  const { data: usedCategories } = await supabase
    .from("produit")
    .select("id_categorie")
    .in("id_categorie", ids);

  const usedIds = new Set((usedCategories ?? []).map((p) => p.id_categorie));
  const deletableIds = ids.filter((id) => !usedIds.has(id));
  const blockedCount = ids.length - deletableIds.length;

  const results = await Promise.allSettled(
    deletableIds.map((id) => deleteCategory(id)),
  );

  const failures = results.filter((r) => r.status === "rejected");
  const totalFailures = failures.length + blockedCount;

  if (totalFailures > 0) {
    throw new Error(
      `${totalFailures} catégorie(s) n'ont pas pu être supprimées.`,
    );
  }
}

async function uploadCategoryImage(
  categoryId: number,
  file: File,
): Promise<{ url: string; filename: string }> {
  try {
    // 1. Vérifier le type de fichier
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

    // 3. Lire le fichier et convertir en WebP avec sharp
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Conversion en WebP avec optimisation
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 80, effort: 6 })
      .toBuffer();

    // 4. Générer un nom de fichier unique
    const filename = `${uuidv4()}.webp`;

    const supabase = createAdminClient();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("category-images")
      .upload(`${categoryId}/${filename}`, webpBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erreur d'upload : ${uploadError.message}`);
    }

    // 6. Récupérer l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from("category-images")
      .getPublicUrl(`${categoryId}/${filename}`);

    return {
      url: publicUrlData.publicUrl,
      filename: filename,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur inconnue lors de l'upload de l'image.");
  }
}

async function updateCategoryImage(
  categoryId: number,
  imageUrl: string | null,
) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("categorie")
    .update({ lien_image_cat: imageUrl })
    .eq("id_categorie", categoryId);

  if (error) {
    throw new Error(`Erreur mise à jour image : ${error.message}`);
  }

  for (const locale of routing.locales) {
    revalidatePath(`/${locale}/admin/categories`, "page");
  }
}

// Fonction pour supprimer une image du bucket
async function deleteCategoryImage(filename: string, categoryId: number) {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from("category-images")
    .remove([`${categoryId}/${filename}`]);

  if (error) {
    throw new Error(`Erreur suppression image : ${error.message}`);
  }
}
