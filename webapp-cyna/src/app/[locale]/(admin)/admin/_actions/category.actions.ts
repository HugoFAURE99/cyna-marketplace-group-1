"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { pickTranslation, type Locale } from "@/lib/i18n/translations";
import { routing } from "@/i18n/routing";
import type { TablesInsert } from "@/types/database.types";

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
      "id_categorie, categorie_traduction ( langue, cat_nom, cat_description )",
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
      };
    })
    .sort((a, b) => a.cat_nom.localeCompare(b.cat_nom, locale));
}

export async function createCategory(formData: CategoryFormData) {
  const supabase = createAdminClient();

  // 1. Ligne catégorie (colonnes neutres uniquement).
  const { data: categorie, error: categorieError } = await supabase
    .from("categorie")
    .insert({})
    .select("id_categorie")
    .single();

  if (categorieError) {
    throw new Error(`Erreur création catégorie : ${categorieError.message}`);
  }

  // 2. Traductions (fr toujours, en si fourni).
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

  revalidatePath("/[locale]/admin/categories", "page");
  return categorie;
}

export async function getCategoryById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorie")
    .select(
      "id_categorie, categorie_traduction ( langue, cat_nom, cat_description )",
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
  };
}

export async function updateCategory(id: number, formData: CategoryFormData) {
  const supabase = createAdminClient();

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

  revalidatePath("/[locale]/admin/categories", "page");
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

  // 2. Suppression de la catégorie (traductions en cascade).
  const { error } = await supabase
    .from("categorie")
    .delete()
    .eq("id_categorie", id);

  if (error) {
    throw new Error(`Erreur suppression catégorie : ${error.message}`);
  }

  revalidatePath("/[locale]/admin/categories", "page");
}
