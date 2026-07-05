"use server";

import { createAdminClient } from "@/lib/supabase/server";

export type PromotionRow = {
  id_promotion: number;
  type_remise: string;
  valeur_remise: number;
  date_expiration: string;
  is_actif: boolean;
  is_code_promo: boolean;
  lien_image_promo: string | null;
  code_promo: string | null;
  produits: { id_produit: number; nom: string }[];
  categories: { id_categorie: number; nom: string }[];
};

export type PromotionDetail = PromotionRow & {
  code_promo_actif: boolean | null;
  code_type_promo: string | null;
};

export async function getPromotions(): Promise<PromotionRow[]> {
  const supabase = await createAdminClient();

  const { data: promos, error } = await supabase
    .from("promotion")
    .select("*")
    .order("id_promotion", { ascending: false });

  if (error || !promos) return [];

  const ids = promos.map((p) => p.id_promotion);

  const [codesRes, produitsRes, categoriesRes] = await Promise.all([
    supabase.from("code_promo").select("id_promotion, lib_code").in("id_promotion", ids),
    supabase
      .from("lien_produit_promo")
      .select("id_promotion, id_produit, produit ( produit_traduction ( nom_pro, langue ) )")
      .in("id_promotion", ids),
    supabase
      .from("lien_categorie_promo")
      .select("id_promotion, id_categorie, categorie ( categorie_traduction ( cat_nom, langue ) )")
      .in("id_promotion", ids),
  ]);

  const codeMap = new Map<number, string>();
  for (const c of codesRes.data || []) {
    codeMap.set(c.id_promotion, c.lib_code);
  }

  const produitMap = new Map<number, { id_produit: number; nom: string }[]>();
  for (const lp of (produitsRes.data as any[]) || []) {
    const arr = produitMap.get(lp.id_promotion) || [];
    const trad = lp.produit?.produit_traduction?.find((t: any) => t.langue === "fr");
    arr.push({ id_produit: lp.id_produit, nom: trad?.nom_pro || `#${lp.id_produit}` });
    produitMap.set(lp.id_promotion, arr);
  }

  const catMap = new Map<number, { id_categorie: number; nom: string }[]>();
  for (const lc of (categoriesRes.data as any[]) || []) {
    const arr = catMap.get(lc.id_promotion) || [];
    const trad = lc.categorie?.categorie_traduction?.find((t: any) => t.langue === "fr");
    arr.push({ id_categorie: lc.id_categorie, nom: trad?.cat_nom || `#${lc.id_categorie}` });
    catMap.set(lc.id_promotion, arr);
  }

  return promos.map((p) => ({
    id_promotion: p.id_promotion,
    type_remise: p.type_remise,
    valeur_remise: p.valeur_remise,
    date_expiration: p.date_expiration,
    is_actif: p.is_actif,
    is_code_promo: p.is_code_promo,
    lien_image_promo: p.lien_image_promo,
    code_promo: codeMap.get(p.id_promotion) || null,
    produits: produitMap.get(p.id_promotion) || [],
    categories: catMap.get(p.id_promotion) || [],
  }));
}

export async function getPromotionById(id: number): Promise<PromotionDetail | null> {
  const supabase = await createAdminClient();

  const { data: promo } = await supabase
    .from("promotion")
    .select("*")
    .eq("id_promotion", id)
    .single();

  if (!promo) return null;

  const [codeRes, produitsRes, categoriesRes] = await Promise.all([
    supabase.from("code_promo").select("*").eq("id_promotion", id).maybeSingle(),
    supabase
      .from("lien_produit_promo")
      .select("id_produit, produit ( produit_traduction ( nom_pro, langue ) )")
      .eq("id_promotion", id),
    supabase
      .from("lien_categorie_promo")
      .select("id_categorie, categorie ( categorie_traduction ( cat_nom, langue ) )")
      .eq("id_promotion", id),
  ]);

  const produits = ((produitsRes.data as any[]) || []).map((lp) => {
    const trad = lp.produit?.produit_traduction?.find((t: any) => t.langue === "fr");
    return { id_produit: lp.id_produit, nom: trad?.nom_pro || `#${lp.id_produit}` };
  });

  const categories = ((categoriesRes.data as any[]) || []).map((lc) => {
    const trad = lc.categorie?.categorie_traduction?.find((t: any) => t.langue === "fr");
    return { id_categorie: lc.id_categorie, nom: trad?.cat_nom || `#${lc.id_categorie}` };
  });

  return {
    id_promotion: promo.id_promotion,
    type_remise: promo.type_remise,
    valeur_remise: promo.valeur_remise,
    date_expiration: promo.date_expiration,
    is_actif: promo.is_actif,
    is_code_promo: promo.is_code_promo,
    lien_image_promo: promo.lien_image_promo,
    code_promo: codeRes.data?.lib_code || null,
    code_promo_actif: codeRes.data?.is_actif ?? null,
    code_type_promo: codeRes.data?.type_promo ?? null,
    produits,
    categories,
  };
}

export async function togglePromotionStatus(id: number, isActif: boolean) {
  const supabase = await createAdminClient();
  await supabase.from("promotion").update({ is_actif: isActif }).eq("id_promotion", id);
}

export async function canDeletePromotion(id: number): Promise<boolean> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("commande")
    .select("id_commande")
    .eq("id_promotion", id)
    .limit(1);

  if (data && data.length > 0) return false;

  const { data: lignes } = await supabase
    .from("ligne_commande")
    .select("id_commande")
    .eq("id_promotion", id)
    .limit(1);

  return !lignes || lignes.length === 0;
}

export async function deletePromotion(id: number) {
  const supabase = await createAdminClient();
  await supabase.from("code_promo").delete().eq("id_promotion", id);
  await supabase.from("lien_produit_promo").delete().eq("id_promotion", id);
  await supabase.from("lien_categorie_promo").delete().eq("id_promotion", id);
  await supabase.from("promotion").delete().eq("id_promotion", id);
}

export async function createPromotion(data: {
  type_remise: string;
  valeur_remise: number;
  date_expiration: string;
  is_actif: boolean;
  is_code_promo: boolean;
  lien_image_promo: string | null;
  code_promo: string | null;
  produit_ids: number[];
  categorie_ids: number[];
}) {
  const supabase = await createAdminClient();

  const { data: promo, error } = await supabase
    .from("promotion")
    .insert({
      type_remise: data.type_remise,
      valeur_remise: data.valeur_remise,
      date_expiration: data.date_expiration,
      is_actif: data.is_actif,
      is_code_promo: data.is_code_promo,
      lien_image_promo: data.lien_image_promo,
    })
    .select("id_promotion")
    .single();

  if (error || !promo) throw new Error("Failed to create promotion");

  const id = promo.id_promotion;

  if (data.is_code_promo && data.code_promo) {
    await supabase.from("code_promo").insert({
      id_promotion: id,
      lib_code: data.code_promo,
      is_actif: true,
    });
  }

  if (data.produit_ids.length > 0) {
    await supabase.from("lien_produit_promo").insert(
      data.produit_ids.map((pid) => ({ id_promotion: id, id_produit: pid }))
    );
  }

  if (data.categorie_ids.length > 0) {
    await supabase.from("lien_categorie_promo").insert(
      data.categorie_ids.map((cid) => ({ id_promotion: id, id_categorie: cid }))
    );
  }

  return id;
}

export async function updatePromotion(
  id: number,
  data: {
    type_remise: string;
    valeur_remise: number;
    date_expiration: string;
    is_actif: boolean;
    is_code_promo: boolean;
    lien_image_promo: string | null;
    code_promo: string | null;
    produit_ids: number[];
    categorie_ids: number[];
  }
) {
  const supabase = await createAdminClient();

  await supabase
    .from("promotion")
    .update({
      type_remise: data.type_remise,
      valeur_remise: data.valeur_remise,
      date_expiration: data.date_expiration,
      is_actif: data.is_actif,
      is_code_promo: data.is_code_promo,
      lien_image_promo: data.lien_image_promo,
    })
    .eq("id_promotion", id);

  // Update code promo
  await supabase.from("code_promo").delete().eq("id_promotion", id);
  if (data.is_code_promo && data.code_promo) {
    await supabase.from("code_promo").insert({
      id_promotion: id,
      lib_code: data.code_promo,
      is_actif: true,
    });
  }

  // Update product links
  await supabase.from("lien_produit_promo").delete().eq("id_promotion", id);
  if (data.produit_ids.length > 0) {
    await supabase.from("lien_produit_promo").insert(
      data.produit_ids.map((pid) => ({ id_promotion: id, id_produit: pid }))
    );
  }

  // Update category links
  await supabase.from("lien_categorie_promo").delete().eq("id_promotion", id);
  if (data.categorie_ids.length > 0) {
    await supabase.from("lien_categorie_promo").insert(
      data.categorie_ids.map((cid) => ({ id_promotion: id, id_categorie: cid }))
    );
  }
}

export async function getAllProducts(): Promise<{ id_produit: number; nom: string }[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("produit")
    .select("id_produit, produit_traduction ( nom_pro, langue )")
    .order("id_produit");

  return ((data as any[]) || []).map((p) => {
    const trad = p.produit_traduction?.find((t: any) => t.langue === "fr");
    return { id_produit: p.id_produit, nom: trad?.nom_pro || `#${p.id_produit}` };
  });
}

export async function getAllCategories(): Promise<{ id_categorie: number; nom: string }[]> {
  const supabase = await createAdminClient();
  const { data } = await supabase
    .from("categorie")
    .select("id_categorie, categorie_traduction ( cat_nom, langue )")
    .order("id_categorie");

  return ((data as any[]) || []).map((c) => {
    const trad = c.categorie_traduction?.find((t: any) => t.langue === "fr");
    return { id_categorie: c.id_categorie, nom: trad?.cat_nom || `#${c.id_categorie}` };
  });
}
