-- Customer purchases hub: retain immutable checkout details without storing
-- sensitive payment data. Existing orders intentionally remain nullable.
ALTER TABLE public.commande
  ADD COLUMN IF NOT EXISTS billing_address_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS payment_method_brand text,
  ADD COLUMN IF NOT EXISTS payment_method_last4 varchar(4);

ALTER TABLE public.commande
  DROP CONSTRAINT IF EXISTS commande_payment_method_last4_check;
ALTER TABLE public.commande
  ADD CONSTRAINT commande_payment_method_last4_check
  CHECK (payment_method_last4 IS NULL OR payment_method_last4 ~ '^[0-9]{4}$');

-- Ownership is direct for current checkouts and may fall back to the profile
-- e-mail for a guest order later claimed by that account.
DROP POLICY IF EXISTS "Client : Voir ses commandes et factures" ON public.commande;
CREATE POLICY "Client : Voir ses commandes et factures"
ON public.commande FOR SELECT
USING (
  auth.uid() = id_compte
  OR lower(mail_utilisateur_invite) = lower((
    SELECT adresse_mail FROM public.utilisateur WHERE id_compte = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Client : Voir le détail de ses factures" ON public.ligne_commande;
CREATE POLICY "Client : Voir le détail de ses factures"
ON public.ligne_commande FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.commande c
    WHERE c.id_commande = ligne_commande.id_commande
      AND (
        c.id_compte = auth.uid()
        OR lower(c.mail_utilisateur_invite) = lower((
          SELECT adresse_mail FROM public.utilisateur WHERE id_compte = auth.uid()
        ))
      )
  )
);
