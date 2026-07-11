-- User-side polish: durable order ownership, idempotent stock finalisation,
-- billing-address defaults, order-linked support tickets, and invoice history.

ALTER TABLE public.commande
  ADD COLUMN IF NOT EXISTS id_compte uuid REFERENCES public.utilisateur(id_compte),
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stock_decremented_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS commande_stripe_checkout_session_id_idx
  ON public.commande (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Backfill ownership from subscriptions first, then from an unambiguous e-mail.
UPDATE public.commande c
SET id_compte = source.id_compte
FROM (
  SELECT id_commande, min(id_compte::text)::uuid AS id_compte
  FROM public.abonnement
  WHERE id_compte IS NOT NULL
  GROUP BY id_commande
  HAVING count(DISTINCT id_compte) = 1
) source
WHERE c.id_commande = source.id_commande
  AND c.id_compte IS NULL;

UPDATE public.commande c
SET id_compte = u.id_compte
FROM public.utilisateur u
WHERE c.id_compte IS NULL
  AND c.mail_utilisateur_invite IS NOT NULL
  AND lower(c.mail_utilisateur_invite) = lower(u.adresse_mail);

ALTER TABLE public.adresse
  ADD COLUMN IF NOT EXISTS is_default boolean NOT NULL DEFAULT false;

WITH ranked AS (
  SELECT id_adresse,
         row_number() OVER (PARTITION BY id_compte ORDER BY id_adresse DESC) AS row_number
  FROM public.adresse
  WHERE id_compte IS NOT NULL AND is_deleted = false
)
UPDATE public.adresse a
SET is_default = true
FROM ranked r
WHERE a.id_adresse = r.id_adresse
  AND r.row_number = 1
  AND NOT EXISTS (
    SELECT 1 FROM public.adresse existing
    WHERE existing.id_compte = a.id_compte
      AND existing.is_deleted = false
      AND existing.is_default = true
  );

CREATE UNIQUE INDEX IF NOT EXISTS adresse_one_default_per_account_idx
  ON public.adresse (id_compte)
  WHERE is_default = true AND is_deleted = false AND id_compte IS NOT NULL;

ALTER TABLE public.ticket_support
  ADD COLUMN IF NOT EXISTS id_commande integer REFERENCES public.commande(id_commande);

-- A Stripe subscription contains one item per purchased tariff. The old unique
-- constraint rejected the second item because all rows share one subscription id.
ALTER TABLE public.abonnement
  DROP CONSTRAINT IF EXISTS abonnement_stripe_subscription_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS abonnement_subscription_tariff_idx
  ON public.abonnement (stripe_subscription_id, id_prix);

CREATE TABLE IF NOT EXISTS public.facture (
  id_facture bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  stripe_invoice_id text NOT NULL UNIQUE,
  id_commande integer REFERENCES public.commande(id_commande),
  id_compte uuid REFERENCES public.utilisateur(id_compte),
  stripe_subscription_id text,
  email_client text,
  date_facture timestamptz NOT NULL,
  montant_total numeric NOT NULL DEFAULT 0,
  devise varchar(3) NOT NULL DEFAULT 'eur',
  statut varchar(32) NOT NULL,
  storage_path text,
  hosted_invoice_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS facture_account_date_idx
  ON public.facture (id_compte, date_facture DESC);
CREATE INDEX IF NOT EXISTS facture_email_date_idx
  ON public.facture (lower(email_client), date_facture DESC);
CREATE INDEX IF NOT EXISTS facture_subscription_idx
  ON public.facture (stripe_subscription_id);

ALTER TABLE public.facture ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Client : Voir ses factures" ON public.facture;
CREATE POLICY "Client : Voir ses factures"
ON public.facture FOR SELECT
USING (
  auth.uid() = id_compte
  OR lower(email_client) = lower((
    SELECT adresse_mail FROM public.utilisateur WHERE id_compte = auth.uid()
  ))
);

-- Finalises a paid order and decrements stock exactly once. Product rows are
-- locked before validation so two concurrent successful sessions cannot make
-- inventory negative.
CREATE OR REPLACE FUNCTION public.finalize_paid_order(p_order_id integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  already_finalized boolean;
  insufficient_product integer;
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

  PERFORM p.id_produit
  FROM public.produit p
  WHERE p.id_produit IN (
    SELECT pt.id_produit
    FROM public.ligne_commande lc
    JOIN public.prix_tarif pt ON pt.id_prix = lc.id_prix
    WHERE lc.id_commande = p_order_id
  )
  ORDER BY p.id_produit
  FOR UPDATE;

  SELECT p.id_produit
  INTO insufficient_product
  FROM public.produit p
  JOIN (
    SELECT pt.id_produit, sum(lc.quantite)::integer AS quantity
    FROM public.ligne_commande lc
    JOIN public.prix_tarif pt ON pt.id_prix = lc.id_prix
    WHERE lc.id_commande = p_order_id
    GROUP BY pt.id_produit
  ) requested ON requested.id_produit = p.id_produit
  WHERE p.quantite_produit < requested.quantity
  LIMIT 1;

  IF insufficient_product IS NOT NULL THEN
    RAISE EXCEPTION 'Insufficient stock for product %', insufficient_product;
  END IF;

  UPDATE public.produit p
  SET quantite_produit = p.quantite_produit - requested.quantity
  FROM (
    SELECT pt.id_produit, sum(lc.quantite)::integer AS quantity
    FROM public.ligne_commande lc
    JOIN public.prix_tarif pt ON pt.id_prix = lc.id_prix
    WHERE lc.id_commande = p_order_id
    GROUP BY pt.id_produit
  ) requested
  WHERE p.id_produit = requested.id_produit;

  UPDATE public.commande
  SET statut_commande = 'Validée', stock_decremented_at = now()
  WHERE id_commande = p_order_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_paid_order(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(integer) TO service_role;
