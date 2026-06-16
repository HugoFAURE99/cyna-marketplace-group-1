"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export async function getCategories() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorie")
    .select("id_categorie, cat_nom, cat_description")
    .order("cat_nom");

  if (error) {
    throw new Error(`Erreur chargement catégories : ${error.message}`);
  }

  return data ?? [];
}

export async function createCategory(formData: {
  cat_nom: string;
  cat_description?: string;
}) {
  const supabase = createAdminClient();

  // 1. Création de la catégorie en base
  const { data: categorie, error: categorieError } = await supabase
    .from("categorie")
    .insert({
      cat_nom: formData.cat_nom,
      cat_description: formData.cat_description,
    })
    .select("id_categorie")
    .single();

  if (categorieError) {
    throw new Error(`Erreur création catégorie : ${categorieError.message}`);
  }

  revalidatePath("/admin/categories");
  return categorie;
}

export async function getCategoryById(id: number) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categorie")
    .select("id_categorie, cat_nom, cat_description")
    .eq("id_categorie", id)
    .single();

  if (error) {
    throw new Error(`Erreur chargement catégorie : ${error.message}`);
  }

  return data;
}

export async function updateCategory(
  id: number,
  formData: {
    cat_nom: string;
    cat_description?: string;
  },
) {
  const supabase = createAdminClient();

  // 1. Mise à jour de la catégorie en base
  const { data: categorie, error: categorieError } = await supabase
    .from("categorie")
    .update({
      cat_nom: formData.cat_nom,
      cat_description: formData.cat_description,
    })
    .eq("id_categorie", id)
    .select("id_categorie")
    .single();

  if (categorieError) {
    throw new Error(`Erreur mise à jour catégorie : ${categorieError.message}`);
  }

  revalidatePath("/admin/categories");
  return categorie;
}

export async function deleteCategory(id: number) {
  const supabase = createAdminClient();

  // 1. Vérification que la catégorie n'est pas utilisée par des produits
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

  // 2. Suppression de la catégorie
  const { error } = await supabase
    .from("categorie")
    .delete()
    .eq("id_categorie", id);

  if (error) {
    throw new Error(`Erreur suppression catégorie : ${error.message}`);
  }

  revalidatePath("/admin/categories");
}
