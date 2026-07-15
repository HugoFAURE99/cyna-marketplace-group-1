import "server-only";

import { cache } from "react";

import {
  resolveAutomaticPromotion,
  type AutomaticPromotionPrice,
  type AutomaticPromotionRule,
} from "@/lib/promotions/automatic-promotion";
import { createPublicClient } from "@/lib/supabase/public";

type PromotableTariff = {
  prix: number;
};

type PromotableProduct<TTariff extends PromotableTariff> = {
  id_categorie: number;
  id_produit: number;
  tariffs: TTariff[];
};

type PromotedProduct<
  TProduct extends PromotableProduct<PromotableTariff>,
> = Omit<TProduct, "tariffs"> & {
  tariffs: (TProduct["tariffs"][number] & AutomaticPromotionPrice)[];
};

export async function enrichProductsWithAutomaticPromotions<
  TProduct extends PromotableProduct<PromotableTariff>,
>(products: TProduct[]): Promise<PromotedProduct<TProduct>[]> {
  if (products.length === 0) return [];

  const rules = await getActiveAutomaticPromotionRules();

  return products.map((product) => ({
    ...product,
    tariffs: product.tariffs.map((tariff) => ({
      ...tariff,
      ...resolveAutomaticPromotion(
        tariff.prix,
        product.id_produit,
        product.id_categorie,
        rules,
      ),
    })),
  }));
}

const getActiveAutomaticPromotionRules = cache(async (): Promise<AutomaticPromotionRule[]> => {
  const supabase = createPublicClient();
  const now = new Date().toISOString();
  const { data: promotions, error: promotionError } = await supabase
    .from("promotion")
    .select(
      "id_promotion, stripe_coupon_id, type_remise, valeur_remise",
    )
    .eq("is_actif", true)
    .eq("is_code_promo", false)
    .gt("date_expiration", now)
    .order("id_promotion", { ascending: true });

  if (promotionError) {
    throw new Error(
      `Erreur chargement promotions automatiques : ${promotionError.message}`,
    );
  }
  if (!promotions?.length) return [];

  const promotionIds = promotions.map((promotion) => promotion.id_promotion);
  const [productLinksResult, categoryLinksResult] = await Promise.all([
    supabase
      .from("lien_produit_promo")
      .select("id_promotion, id_produit")
      .in("id_promotion", promotionIds),
    supabase
      .from("lien_categorie_promo")
      .select("id_promotion, id_categorie")
      .in("id_promotion", promotionIds),
  ]);

  if (productLinksResult.error) {
    throw new Error(
      `Erreur chargement promotions produit : ${productLinksResult.error.message}`,
    );
  }
  if (categoryLinksResult.error) {
    throw new Error(
      `Erreur chargement promotions categorie : ${categoryLinksResult.error.message}`,
    );
  }

  return promotions.flatMap((promotion) => {
    if (
      !promotion.stripe_coupon_id ||
      (promotion.type_remise !== "pourcentage" && promotion.type_remise !== "fixe")
    ) {
      return [];
    }

    return [{
      id: promotion.id_promotion,
      stripeCouponId: promotion.stripe_coupon_id,
      type: promotion.type_remise,
      value: Number(promotion.valeur_remise),
      productIds: (productLinksResult.data ?? [])
        .filter((link) => link.id_promotion === promotion.id_promotion)
        .map((link) => link.id_produit),
      categoryIds: (categoryLinksResult.data ?? [])
        .filter((link) => link.id_promotion === promotion.id_promotion)
        .map((link) => link.id_categorie),
    } satisfies AutomaticPromotionRule];
  });
});
