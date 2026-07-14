-- Restore the public promotion reads used by the server-rendered storefront.
-- Only active, unexpired promotions and their target links are exposed.

GRANT SELECT ON TABLE public.promotion TO anon, authenticated;
GRANT SELECT ON TABLE public.lien_produit_promo TO anon, authenticated;
GRANT SELECT ON TABLE public.lien_categorie_promo TO anon, authenticated;

DROP POLICY IF EXISTS "Catalogue : Promotions visibles par tous"
  ON public.promotion;
DROP POLICY IF EXISTS "Public read active promotions"
  ON public.promotion;

CREATE POLICY "Public read active promotions"
ON public.promotion
FOR SELECT
TO anon, authenticated
USING (
  is_actif = true
  AND date_expiration > now()
);

DROP POLICY IF EXISTS "Catalogue : Liens Promo-Produit visibles"
  ON public.lien_produit_promo;
DROP POLICY IF EXISTS "Public read active product promotion links"
  ON public.lien_produit_promo;

CREATE POLICY "Public read active product promotion links"
ON public.lien_produit_promo
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.promotion
    WHERE promotion.id_promotion = lien_produit_promo.id_promotion
      AND promotion.is_actif = true
      AND promotion.date_expiration > now()
  )
);

DROP POLICY IF EXISTS "Catalogue : Liens Promo-Catégorie visibles"
  ON public.lien_categorie_promo;
DROP POLICY IF EXISTS "Catalogue : Liens Promo-CatÃ©gorie visibles"
  ON public.lien_categorie_promo;
DROP POLICY IF EXISTS "Public read active category promotion links"
  ON public.lien_categorie_promo;

CREATE POLICY "Public read active category promotion links"
ON public.lien_categorie_promo
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.promotion
    WHERE promotion.id_promotion = lien_categorie_promo.id_promotion
      AND promotion.is_actif = true
      AND promotion.date_expiration > now()
  )
);
