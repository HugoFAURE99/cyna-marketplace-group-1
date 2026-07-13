-- CYNA subscriptions mirror Stripe subscription items. A row is a service,
-- while nombre_utilisateurs is the number of licensed users for that service.

ALTER TABLE public.abonnement
  ADD COLUMN stripe_subscription_item_id text,
  ADD COLUMN nombre_utilisateurs integer NOT NULL DEFAULT 1,
  ADD COLUMN annulation_programmee boolean NOT NULL DEFAULT false;

ALTER TABLE public.abonnement
  ADD CONSTRAINT abonnement_nombre_utilisateurs_check
  CHECK (nombre_utilisateurs BETWEEN 1 AND 50);

DROP INDEX IF EXISTS public.abonnement_subscription_tariff_idx;

CREATE UNIQUE INDEX abonnement_stripe_subscription_item_idx
  ON public.abonnement(stripe_subscription_item_id)
  WHERE stripe_subscription_item_id IS NOT NULL;

CREATE INDEX abonnement_stripe_subscription_idx
  ON public.abonnement(stripe_subscription_id);

COMMENT ON COLUMN public.abonnement.stripe_subscription_item_id IS
  'Stripe subscription item mirrored by this service row; nullable only during legacy rollout.';
COMMENT ON COLUMN public.abonnement.nombre_utilisateurs IS
  'Current Stripe item quantity (licensed users), between 1 and 50.';
COMMENT ON COLUMN public.abonnement.annulation_programmee IS
  'True when this service is scheduled to be removed at the current period end.';

-- SaaS licences are not physical stock. Keep quantite_produit temporarily for
-- backward compatibility, but drive storefront availability with this flag.
ALTER TABLE public.produit
  ADD COLUMN est_disponible boolean NOT NULL DEFAULT true;

UPDATE public.produit
SET est_disponible = quantite_produit > 0;

COMMENT ON COLUMN public.produit.quantite_produit IS
  'Deprecated: legacy stock field. SaaS licence quantities do not consume stock.';
COMMENT ON COLUMN public.produit.est_disponible IS
  'Manual commercial availability of this SaaS service.';

-- Preserve the existing function name/call site and its idempotency marker,
-- but stop validating or decrementing SaaS stock.
CREATE OR REPLACE FUNCTION public.finalize_paid_order(p_order_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_finalized boolean;
BEGIN
  SELECT stock_decremented_at IS NOT NULL
  INTO already_finalized
  FROM public.commande
  WHERE id_commande = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown order %', p_order_id;
  END IF;
  IF already_finalized THEN
    RETURN false;
  END IF;

  UPDATE public.commande
  SET statut_commande = 'Validée', stock_decremented_at = now()
  WHERE id_commande = p_order_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_paid_order(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(integer) TO service_role;
