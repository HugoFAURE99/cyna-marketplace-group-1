"use server";

import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

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
  stripe_duration: string;
  duree_mois: number | null;
};

type PromotionInput = {
  type_remise: string;
  valeur_remise: number;
  date_expiration: string;
  is_actif: boolean;
  is_code_promo: boolean;
  lien_image_promo: string | null;
  code_promo: string | null;
  produit_ids: number[];
  categorie_ids: number[];
  stripe_duration: string;
  duree_mois: number | null;
};

// A date whose year is beyond this is treated as "no expiration" (matches the
// 2999 sentinel written by the form's "no expiration" toggle).
const NO_EXPIRATION_YEAR = 2099;

/**
 * Resolve the Stripe product ids a promotion targets, from the linked products
 * and the products belonging to the linked categories. Products without a
 * synced stripe_product_id are skipped.
 */
async function resolveStripeProductIds(
  supabase: Awaited<ReturnType<typeof createAdminClient>>,
  produitIds: number[],
  categorieIds: number[],
): Promise<string[]> {
  const ids = new Set<string>();

  if (produitIds.length > 0) {
    const { data } = await supabase
      .from("produit")
      .select("stripe_product_id")
      .in("id_produit", produitIds);
    for (const p of data ?? []) {
      if (p.stripe_product_id) ids.add(p.stripe_product_id);
    }
  }

  if (categorieIds.length > 0) {
    const { data } = await supabase
      .from("produit")
      .select("stripe_product_id")
      .in("id_categorie", categorieIds);
    for (const p of data ?? []) {
      if (p.stripe_product_id) ids.add(p.stripe_product_id);
    }
  }

  return [...ids];
}

/** Create a Stripe coupon mirroring the promotion's discount definition. */
async function createStripeCoupon(
  data: PromotionInput,
  productIds: string[],
): Promise<string> {
  const params: Stripe.CouponCreateParams = {
    duration: (data.stripe_duration || "once") as Stripe.CouponCreateParams.Duration,
  };

  if (data.type_remise === "pourcentage") {
    params.percent_off = data.valeur_remise;
  } else {
    params.amount_off = Math.round(data.valeur_remise * 100);
    params.currency = "eur";
  }

  if (data.stripe_duration === "repeating" && data.duree_mois) {
    params.duration_in_months = data.duree_mois;
  }

  if (productIds.length > 0) {
    params.applies_to = { products: productIds };
  }

  const coupon = await stripe.coupons.create(params);
  return coupon.id;
}

/** Create a Stripe promotion code wrapping a coupon. */
async function createStripePromotionCode(
  couponId: string,
  code: string,
  expiration: string,
  active: boolean,
): Promise<string> {
  const params: Stripe.PromotionCodeCreateParams = {
    promotion: { type: "coupon", coupon: couponId },
    code,
    active,
  };

  const expDate = new Date(expiration);
  if (expDate.getFullYear() <= NO_EXPIRATION_YEAR) {
    params.expires_at = Math.floor(expDate.getTime() / 1000);
  }

  const pc = await stripe.promotionCodes.create(params);
  return pc.id;
}

/** Best-effort deletion of a Stripe coupon (also deactivates its promo codes). */
async function deleteStripeCoupon(couponId: string | null | undefined) {
  if (!couponId) return;
  try {
    await stripe.coupons.del(couponId);
  } catch (e) {
    console.error("Stripe coupon deletion failed:", e);
  }
}

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
    stripe_duration: promo.stripe_duration ?? "once",
    duree_mois: promo.duree_mois ?? null,
    produits,
    categories,
  };
}

export async function togglePromotionStatus(id: number, isActif: boolean) {
  const supabase = await createAdminClient();
  await supabase.from("promotion").update({ is_actif: isActif }).eq("id_promotion", id);

  // Mirror the active state onto the Stripe promotion code (code promos only).
  const { data: code } = await supabase
    .from("code_promo")
    .select("stripe_promotion_code_id")
    .eq("id_promotion", id)
    .maybeSingle();

  if (code?.stripe_promotion_code_id) {
    try {
      await stripe.promotionCodes.update(code.stripe_promotion_code_id, {
        active: isActif,
      });
    } catch (e) {
      console.error("Stripe promotion code toggle failed:", e);
    }
    await supabase
      .from("code_promo")
      .update({ is_actif: isActif })
      .eq("id_promotion", id);
  }
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

  // Remove the Stripe coupon first (this also deactivates its promotion code).
  const { data: promo } = await supabase
    .from("promotion")
    .select("stripe_coupon_id")
    .eq("id_promotion", id)
    .maybeSingle();
  await deleteStripeCoupon(promo?.stripe_coupon_id);

  await supabase.from("code_promo").delete().eq("id_promotion", id);
  await supabase.from("lien_produit_promo").delete().eq("id_promotion", id);
  await supabase.from("lien_categorie_promo").delete().eq("id_promotion", id);
  await supabase.from("promotion").delete().eq("id_promotion", id);
}

export async function createPromotion(data: PromotionInput) {
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
      stripe_duration: data.stripe_duration,
      duree_mois: data.duree_mois,
    })
    .select("id_promotion")
    .single();

  if (error || !promo) throw new Error("Failed to create promotion");

  const id = promo.id_promotion;

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

  // ─── Stripe sync ───
  // Best-effort: a Stripe failure must not break the backoffice creation.
  try {
    const productIds = await resolveStripeProductIds(
      supabase,
      data.produit_ids,
      data.categorie_ids,
    );
    const couponId = await createStripeCoupon(data, productIds);
    await supabase
      .from("promotion")
      .update({ stripe_coupon_id: couponId })
      .eq("id_promotion", id);

    let stripePromotionCodeId: string | null = null;
    if (data.is_code_promo && data.code_promo) {
      stripePromotionCodeId = await createStripePromotionCode(
        couponId,
        data.code_promo,
        data.date_expiration,
        data.is_actif,
      );
    }

    if (data.is_code_promo && data.code_promo) {
      await supabase.from("code_promo").insert({
        id_promotion: id,
        lib_code: data.code_promo,
        is_actif: data.is_actif,
        stripe_promotion_code_id: stripePromotionCodeId,
      });
    }
  } catch (e) {
    console.error("Stripe promotion sync (create) failed:", e);
    // Still persist the code promo row so the backoffice stays consistent.
    if (data.is_code_promo && data.code_promo) {
      await supabase.from("code_promo").insert({
        id_promotion: id,
        lib_code: data.code_promo,
        is_actif: data.is_actif,
      });
    }
  }

  return id;
}

export async function updatePromotion(id: number, data: PromotionInput) {
  const supabase = await createAdminClient();

  // Fetch the previous Stripe coupon so we can archive it (coupons are
  // immutable, so any change means recreating them).
  const { data: previous } = await supabase
    .from("promotion")
    .select("stripe_coupon_id")
    .eq("id_promotion", id)
    .maybeSingle();

  await supabase
    .from("promotion")
    .update({
      type_remise: data.type_remise,
      valeur_remise: data.valeur_remise,
      date_expiration: data.date_expiration,
      is_actif: data.is_actif,
      is_code_promo: data.is_code_promo,
      lien_image_promo: data.lien_image_promo,
      stripe_duration: data.stripe_duration,
      duree_mois: data.duree_mois,
    })
    .eq("id_promotion", id);

  await supabase.from("code_promo").delete().eq("id_promotion", id);

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

  // ─── Stripe sync ───
  try {
    // Archive the old coupon (immutability) then create the new one.
    await deleteStripeCoupon(previous?.stripe_coupon_id);

    const productIds = await resolveStripeProductIds(
      supabase,
      data.produit_ids,
      data.categorie_ids,
    );
    const couponId = await createStripeCoupon(data, productIds);
    await supabase
      .from("promotion")
      .update({ stripe_coupon_id: couponId })
      .eq("id_promotion", id);

    if (data.is_code_promo && data.code_promo) {
      const stripePromotionCodeId = await createStripePromotionCode(
        couponId,
        data.code_promo,
        data.date_expiration,
        data.is_actif,
      );
      await supabase.from("code_promo").insert({
        id_promotion: id,
        lib_code: data.code_promo,
        is_actif: data.is_actif,
        stripe_promotion_code_id: stripePromotionCodeId,
      });
    }
  } catch (e) {
    console.error("Stripe promotion sync (update) failed:", e);
    if (data.is_code_promo && data.code_promo) {
      await supabase.from("code_promo").insert({
        id_promotion: id,
        lib_code: data.code_promo,
        is_actif: data.is_actif,
      });
    }
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
