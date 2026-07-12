-- CYNA final database structure
-- Fresh installations only. This file contains no data migration or seed data.
-- Do not run it on the existing populated Supabase project.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TYPE public.langue AS ENUM ('fr', 'en');
CREATE TYPE public.support_ticket_category AS ENUM (
  'billing', 'order', 'subscription', 'account', 'technical', 'other'
);
CREATE TYPE public.support_ticket_status AS ENUM (
  'open', 'in_progress', 'waiting_customer', 'resolved', 'closed'
);
CREATE TYPE public.support_message_sender AS ENUM ('customer', 'support');

CREATE TABLE public.utilisateur (
  id_compte uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  is_actif boolean NOT NULL DEFAULT true,
  nom_complet text NOT NULL,
  adresse_mail text NOT NULL UNIQUE,
  token_connexion_stripe text NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'user'
);

CREATE TABLE public.categorie (
  id_categorie integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lien_image_cat text,
  ordre_affichage integer DEFAULT 0
);

CREATE TABLE public.promotion (
  id_promotion integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  is_code_promo boolean NOT NULL DEFAULT false,
  type_remise varchar(50) NOT NULL,
  valeur_remise numeric NOT NULL,
  date_expiration timestamptz NOT NULL,
  is_actif boolean NOT NULL DEFAULT true,
  lien_image_promo text,
  stripe_coupon_id text,
  stripe_duration text NOT NULL DEFAULT 'once',
  duree_mois integer
);

CREATE TABLE public.texte_general (
  id_texte integer GENERATED ALWAYS AS IDENTITY,
  texte text NOT NULL,
  emplacement_texte varchar(100) NOT NULL,
  langue public.langue NOT NULL DEFAULT 'fr',
  PRIMARY KEY (emplacement_texte, langue)
);

CREATE TABLE public.image_carrousel (
  id_image integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lien_image_caroussel text NOT NULL,
  est_actif boolean NOT NULL DEFAULT true,
  ordre integer NOT NULL DEFAULT 0
);

CREATE TABLE public.produit (
  id_produit integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  quantite_produit integer NOT NULL DEFAULT 0,
  statut_produit boolean NOT NULL DEFAULT true,
  mis_avant boolean NOT NULL DEFAULT false,
  mis_avant_ordre integer NOT NULL DEFAULT 0,
  is_priorite boolean NOT NULL DEFAULT false,
  ordre_priorite integer NOT NULL DEFAULT 0,
  date_ajout timestamptz NOT NULL DEFAULT now(),
  id_categorie integer NOT NULL REFERENCES public.categorie(id_categorie),
  stripe_product_id text UNIQUE
);

CREATE TABLE public.code_promo (
  id_code_promo integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lib_code varchar(50) NOT NULL UNIQUE,
  is_actif boolean NOT NULL DEFAULT true,
  type_promo varchar(50),
  id_promotion integer NOT NULL UNIQUE REFERENCES public.promotion(id_promotion),
  stripe_promotion_code_id text
);

CREATE TABLE public.commande (
  id_commande integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date_commande timestamptz NOT NULL DEFAULT now(),
  montant_total numeric NOT NULL,
  statut_commande varchar(50) NOT NULL DEFAULT 'En attente',
  url_facture text,
  mail_utilisateur_invite text,
  id_promotion integer REFERENCES public.promotion(id_promotion),
  id_compte uuid REFERENCES public.utilisateur(id_compte),
  stripe_checkout_session_id text,
  stock_decremented_at timestamptz,
  billing_address_snapshot jsonb,
  payment_method_brand text,
  payment_method_last4 varchar(4),
  CONSTRAINT commande_payment_method_last4_check
    CHECK (payment_method_last4 IS NULL OR payment_method_last4 ~ '^[0-9]{4}$')
);

CREATE TABLE public.adresse (
  id_adresse integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  prenom text NOT NULL,
  nom text NOT NULL,
  adresse text NOT NULL,
  adresse_complement text,
  code_postal varchar(20) NOT NULL,
  ville text NOT NULL,
  region text,
  pays text NOT NULL,
  telephone varchar(50),
  type_adresse varchar(50),
  is_deleted boolean NOT NULL DEFAULT false,
  id_compte uuid REFERENCES public.utilisateur(id_compte),
  mail_utilisateur_invite text,
  is_default boolean NOT NULL DEFAULT false
);

CREATE TABLE public.lien_categorie_promo (
  id_categorie integer NOT NULL REFERENCES public.categorie(id_categorie),
  id_promotion integer NOT NULL REFERENCES public.promotion(id_promotion),
  PRIMARY KEY (id_categorie, id_promotion)
);

CREATE TABLE public.image_produit (
  id_image integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lien_image_produit text NOT NULL,
  ordre_affichage integer DEFAULT 0,
  id_produit integer NOT NULL REFERENCES public.produit(id_produit)
);

CREATE TABLE public.prix_tarif (
  id_prix integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type_facturation varchar(50) NOT NULL,
  prix integer NOT NULL,
  stripe_price_id text NOT NULL UNIQUE,
  id_produit integer NOT NULL REFERENCES public.produit(id_produit)
);

CREATE TABLE public.lien_produit_promo (
  id_produit integer NOT NULL REFERENCES public.produit(id_produit),
  id_promotion integer NOT NULL REFERENCES public.promotion(id_promotion),
  PRIMARY KEY (id_produit, id_promotion)
);

CREATE TABLE public.abonnement (
  id_abonnement integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  statut_abonnement varchar(50) NOT NULL,
  date_debut timestamptz NOT NULL,
  date_fin timestamptz,
  id_prix integer NOT NULL REFERENCES public.prix_tarif(id_prix),
  id_commande integer NOT NULL REFERENCES public.commande(id_commande),
  id_compte uuid REFERENCES public.utilisateur(id_compte),
  stripe_subscription_id text
);

CREATE TABLE public.ligne_commande (
  id_prix integer NOT NULL REFERENCES public.prix_tarif(id_prix),
  id_commande integer NOT NULL REFERENCES public.commande(id_commande),
  id_promotion integer REFERENCES public.promotion(id_promotion),
  quantite integer NOT NULL DEFAULT 1,
  prix_unitaire numeric NOT NULL,
  sous_total numeric NOT NULL,
  remise_unitaire_appliquee varchar(50),
  taux_remise_donne varchar(50),
  PRIMARY KEY (id_prix, id_commande)
);

CREATE TABLE public.produit_traduction (
  id_produit integer NOT NULL REFERENCES public.produit(id_produit) ON DELETE CASCADE,
  langue public.langue NOT NULL,
  nom_pro text NOT NULL,
  pro_description text,
  pro_carac_technique text,
  PRIMARY KEY (id_produit, langue)
);

CREATE TABLE public.categorie_traduction (
  id_categorie integer NOT NULL REFERENCES public.categorie(id_categorie) ON DELETE CASCADE,
  langue public.langue NOT NULL,
  cat_nom text NOT NULL,
  cat_description text,
  PRIMARY KEY (id_categorie, langue)
);

CREATE TABLE public.prix_tarif_traduction (
  id_prix integer NOT NULL REFERENCES public.prix_tarif(id_prix) ON DELETE CASCADE,
  langue public.langue NOT NULL,
  nom_prix_tarif text,
  unite text,
  PRIMARY KEY (id_prix, langue)
);

CREATE TABLE public.image_carrousel_traduction (
  id_image integer NOT NULL REFERENCES public.image_carrousel(id_image) ON DELETE CASCADE,
  langue public.langue NOT NULL,
  titre_image text NOT NULL,
  description_image text,
  PRIMARY KEY (id_image, langue)
);

CREATE TABLE public.caracteristique_technique (
  id_caracteristique integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date_creation timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.caracteristique_technique_traduction (
  id_caracteristique integer NOT NULL
    REFERENCES public.caracteristique_technique(id_caracteristique) ON DELETE CASCADE,
  langue public.langue NOT NULL,
  nom_caracteristique text NOT NULL,
  PRIMARY KEY (id_caracteristique, langue),
  CHECK (length(btrim(nom_caracteristique)) > 0)
);

CREATE TABLE public.produit_caracteristique_technique (
  id_produit integer NOT NULL REFERENCES public.produit(id_produit) ON DELETE CASCADE,
  id_caracteristique integer NOT NULL
    REFERENCES public.caracteristique_technique(id_caracteristique) ON DELETE CASCADE,
  ordre_affichage integer NOT NULL DEFAULT 0,
  PRIMARY KEY (id_produit, id_caracteristique)
);

CREATE TABLE public.facture (
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

CREATE TABLE public.ticket_support (
  id_support uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sujet text NOT NULL,
  description text,
  date_creation timestamptz DEFAULT now(),
  date_fermeture timestamptz,
  email_contact text NOT NULL,
  status public.support_ticket_status NOT NULL DEFAULT 'open',
  categorie public.support_ticket_category NOT NULL DEFAULT 'other',
  origine_chatbot boolean DEFAULT false,
  id_compte uuid REFERENCES public.utilisateur(id_compte),
  id_commande integer REFERENCES public.commande(id_commande),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ticket_support_message (
  id_message bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_support uuid NOT NULL REFERENCES public.ticket_support(id_support) ON DELETE CASCADE,
  sender public.support_message_sender NOT NULL,
  auteur_id uuid REFERENCES public.utilisateur(id_compte) ON DELETE SET NULL,
  contenu text NOT NULL CHECK (length(btrim(contenu)) BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX commande_stripe_checkout_session_id_idx
  ON public.commande(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;
CREATE INDEX commande_guest_email_lower_idx
  ON public.commande(lower(mail_utilisateur_invite))
  WHERE mail_utilisateur_invite IS NOT NULL;
CREATE UNIQUE INDEX adresse_one_default_per_account_idx
  ON public.adresse(id_compte)
  WHERE is_default = true AND is_deleted = false AND id_compte IS NOT NULL;
CREATE UNIQUE INDEX abonnement_subscription_tariff_idx
  ON public.abonnement(stripe_subscription_id, id_prix);
CREATE INDEX facture_account_date_idx
  ON public.facture(id_compte, date_facture DESC);
CREATE INDEX facture_email_date_idx
  ON public.facture(lower(email_client), date_facture DESC);
CREATE INDEX facture_subscription_idx
  ON public.facture(stripe_subscription_id);
CREATE UNIQUE INDEX caracteristique_technique_traduction_nom_unique
  ON public.caracteristique_technique_traduction(
    langue, lower(btrim(nom_caracteristique))
  );
CREATE INDEX produit_caracteristique_technique_produit_order_idx
  ON public.produit_caracteristique_technique(
    id_produit, ordre_affichage, id_caracteristique
  );
CREATE INDEX produit_caracteristique_technique_caracteristique_idx
  ON public.produit_caracteristique_technique(id_caracteristique);
CREATE INDEX ticket_support_account_activity_idx
  ON public.ticket_support(id_compte, updated_at DESC)
  WHERE id_compte IS NOT NULL;
CREATE INDEX ticket_support_order_idx
  ON public.ticket_support(id_commande)
  WHERE id_commande IS NOT NULL;
CREATE INDEX ticket_support_message_timeline_idx
  ON public.ticket_support_message(id_support, created_at, id_message);

CREATE OR REPLACE FUNCTION public.est_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.utilisateur
    WHERE id_compte = auth.uid()
      AND role = 'admin'
      AND is_actif = true
  );
END;
$$;

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

CREATE OR REPLACE FUNCTION public.set_ticket_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_ticket_from_message()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  UPDATE public.ticket_support
  SET updated_at = GREATEST(updated_at, NEW.created_at)
  WHERE id_support = NEW.id_support;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_support_ticket(
  p_sujet text,
  p_email_contact text,
  p_description text,
  p_categorie public.support_ticket_category,
  p_id_compte uuid DEFAULT NULL,
  p_id_commande integer DEFAULT NULL,
  p_origine_chatbot boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  created_ticket uuid;
BEGIN
  IF length(btrim(p_sujet)) NOT BETWEEN 1 AND 200
     OR length(btrim(p_email_contact)) NOT BETWEEN 3 AND 254
     OR length(btrim(p_description)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Invalid support ticket input';
  END IF;

  IF p_id_compte IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.utilisateur WHERE id_compte = p_id_compte
  ) THEN
    RAISE EXCEPTION 'Unknown account';
  END IF;

  IF p_id_commande IS NOT NULL AND (
    p_id_compte IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.commande c
      WHERE c.id_commande = p_id_commande
        AND (
          c.id_compte = p_id_compte
          OR lower(c.mail_utilisateur_invite) = lower((
            SELECT u.adresse_mail
            FROM public.utilisateur u
            WHERE u.id_compte = p_id_compte
          ))
        )
    )
  ) THEN
    RAISE EXCEPTION 'Order does not belong to account';
  END IF;

  INSERT INTO public.ticket_support (
    sujet, description, email_contact, status, categorie,
    origine_chatbot, id_compte, id_commande
  ) VALUES (
    btrim(p_sujet), btrim(p_description), lower(btrim(p_email_contact)),
    'open', p_categorie, p_origine_chatbot, p_id_compte, p_id_commande
  )
  RETURNING id_support INTO created_ticket;

  INSERT INTO public.ticket_support_message (
    id_support, sender, auteur_id, contenu
  ) VALUES (
    created_ticket, 'customer', p_id_compte, btrim(p_description)
  );

  RETURN created_ticket;
END;
$$;

CREATE TRIGGER ticket_support_set_updated_at
BEFORE UPDATE ON public.ticket_support
FOR EACH ROW EXECUTE FUNCTION public.set_ticket_updated_at();

CREATE TRIGGER ticket_support_message_touch_ticket
AFTER INSERT ON public.ticket_support_message
FOR EACH ROW EXECUTE FUNCTION public.touch_ticket_from_message();

REVOKE ALL ON FUNCTION public.finalize_paid_order(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_paid_order(integer) TO service_role;
REVOKE ALL ON FUNCTION public.create_support_ticket(
  text, text, text, public.support_ticket_category, uuid, integer, boolean
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_support_ticket(
  text, text, text, public.support_ticket_category, uuid, integer, boolean
) TO service_role;

ALTER TABLE public.utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.texte_general ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_carrousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adresse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lien_categorie_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_produit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prix_tarif ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lien_produit_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ligne_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produit_traduction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorie_traduction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prix_tarif_traduction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_carrousel_traduction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caracteristique_technique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caracteristique_technique_traduction ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produit_caracteristique_technique ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facture ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_support_message ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalogue : Catégories visibles par tous"
ON public.categorie FOR SELECT USING (true);
CREATE POLICY "Catalogue : Produits visibles par tous"
ON public.produit FOR SELECT USING (statut_produit = true);
CREATE POLICY "Catalogue : Prix visibles par tous"
ON public.prix_tarif FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.produit
    WHERE produit.id_produit = prix_tarif.id_produit
      AND produit.statut_produit = true
  )
);
CREATE POLICY "Catalogue : Images visibles par tous"
ON public.image_produit FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.produit
    WHERE produit.id_produit = image_produit.id_produit
      AND produit.statut_produit = true
  )
);
CREATE POLICY "Catalogue : Promotions visibles par tous"
ON public.promotion FOR SELECT USING (
  is_actif = true AND date_expiration > now()
);
CREATE POLICY "Catalogue : Liens Promo-Produit visibles"
ON public.lien_produit_promo FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.promotion
    WHERE promotion.id_promotion = lien_produit_promo.id_promotion
      AND promotion.is_actif = true
      AND promotion.date_expiration > now()
  )
);
CREATE POLICY "Catalogue : Liens Promo-Catégorie visibles"
ON public.lien_categorie_promo FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.promotion
    WHERE promotion.id_promotion = lien_categorie_promo.id_promotion
      AND promotion.is_actif = true
      AND promotion.date_expiration > now()
  )
);
CREATE POLICY "Visiteurs : Voir le carrousel actif"
ON public.image_carrousel FOR SELECT USING (est_actif = true);
CREATE POLICY "Visiteurs : Voir les textes généraux"
ON public.texte_general FOR SELECT USING (true);

CREATE POLICY "Public read active produit_traduction"
ON public.produit_traduction FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.produit p
    WHERE p.id_produit = produit_traduction.id_produit
      AND p.statut_produit = true
  )
);
CREATE POLICY "Public read categorie_traduction"
ON public.categorie_traduction FOR SELECT USING (true);
CREATE POLICY "Public read active prix_tarif_traduction"
ON public.prix_tarif_traduction FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.prix_tarif pt
    JOIN public.produit p ON p.id_produit = pt.id_produit
    WHERE pt.id_prix = prix_tarif_traduction.id_prix
      AND p.statut_produit = true
  )
);
CREATE POLICY "Public read active image_carrousel_traduction"
ON public.image_carrousel_traduction FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.image_carrousel image
    WHERE image.id_image = image_carrousel_traduction.id_image
      AND image.est_actif = true
  )
);
CREATE POLICY "Public read active product characteristic links"
ON public.produit_caracteristique_technique FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.produit
    WHERE produit.id_produit = produit_caracteristique_technique.id_produit
      AND produit.statut_produit = true
  )
);
CREATE POLICY "Public read active product characteristics"
ON public.caracteristique_technique FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.produit_caracteristique_technique pct
    JOIN public.produit p ON p.id_produit = pct.id_produit
    WHERE pct.id_caracteristique = caracteristique_technique.id_caracteristique
      AND p.statut_produit = true
  )
);
CREATE POLICY "Public read active product characteristic translations"
ON public.caracteristique_technique_traduction FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.produit_caracteristique_technique pct
    JOIN public.produit p ON p.id_produit = pct.id_produit
    WHERE pct.id_caracteristique =
      caracteristique_technique_traduction.id_caracteristique
      AND p.statut_produit = true
  )
);

CREATE POLICY "Client : Voir son profil"
ON public.utilisateur FOR SELECT USING (auth.uid() = id_compte);
CREATE POLICY "Client : Voir ses adresses"
ON public.adresse FOR SELECT USING (auth.uid() = id_compte);
CREATE POLICY "Client : Ajouter une adresse"
ON public.adresse FOR INSERT WITH CHECK (auth.uid() = id_compte);
CREATE POLICY "Client : Modifier son adresse"
ON public.adresse FOR UPDATE
USING (auth.uid() = id_compte)
WITH CHECK (auth.uid() = id_compte);
CREATE POLICY "Client : Voir ses abonnements"
ON public.abonnement FOR SELECT USING (auth.uid() = id_compte);
CREATE POLICY "Client : Voir ses commandes et factures"
ON public.commande FOR SELECT USING (
  auth.uid() = id_compte
  OR lower(mail_utilisateur_invite) = lower((
    SELECT adresse_mail FROM public.utilisateur WHERE id_compte = auth.uid()
  ))
);
CREATE POLICY "Client : Voir le détail de ses factures"
ON public.ligne_commande FOR SELECT USING (
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
CREATE POLICY "Client : Voir ses factures"
ON public.facture FOR SELECT USING (
  auth.uid() = id_compte
  OR lower(email_client) = lower((
    SELECT adresse_mail FROM public.utilisateur WHERE id_compte = auth.uid()
  ))
);
CREATE POLICY "Client : Voir ses tickets"
ON public.ticket_support FOR SELECT USING (auth.uid() = id_compte);
CREATE POLICY "Client : Voir les messages de ses tickets"
ON public.ticket_support_message FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.ticket_support ticket
    WHERE ticket.id_support = ticket_support_message.id_support
      AND ticket.id_compte = auth.uid()
  )
);

CREATE POLICY "Admin : Gérer les utilisateurs"
ON public.utilisateur FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les catégories"
ON public.categorie FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les promotions"
ON public.promotion FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les textes"
ON public.texte_general FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer le carrousel"
ON public.image_carrousel FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les produits"
ON public.produit FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les codes promo"
ON public.code_promo FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les commandes"
ON public.commande FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les adresses"
ON public.adresse FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les liens catégorie-promotion"
ON public.lien_categorie_promo FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les images produit"
ON public.image_produit FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les prix"
ON public.prix_tarif FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les liens produit-promotion"
ON public.lien_produit_promo FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les abonnements"
ON public.abonnement FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les lignes de commande"
ON public.ligne_commande FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les traductions produit"
ON public.produit_traduction FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les traductions catégorie"
ON public.categorie_traduction FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les traductions prix"
ON public.prix_tarif_traduction FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les traductions carrousel"
ON public.image_carrousel_traduction FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les caractéristiques"
ON public.caracteristique_technique FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les traductions caractéristiques"
ON public.caracteristique_technique_traduction FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les liens caractéristiques"
ON public.produit_caracteristique_technique FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les factures"
ON public.facture FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les tickets support"
ON public.ticket_support FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());
CREATE POLICY "Admin : Gérer les messages support"
ON public.ticket_support_message FOR ALL
USING (public.est_admin()) WITH CHECK (public.est_admin());

CREATE POLICY "Public read marketplace images"
ON storage.objects FOR SELECT
USING (bucket_id IN ('product-images', 'category-images', 'carousel-images'));
CREATE POLICY "Admin manage marketplace images"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id IN ('product-images', 'category-images', 'carousel-images')
  AND public.est_admin()
)
WITH CHECK (
  bucket_id IN ('product-images', 'category-images', 'carousel-images')
  AND public.est_admin()
);

COMMENT ON COLUMN public.ticket_support.description IS
  'Legacy opening-message copy. Read conversations from ticket_support_message.';
COMMENT ON COLUMN public.commande.url_facture IS
  'Legacy invoice filename/path indicator. Current invoices are stored in facture.';

