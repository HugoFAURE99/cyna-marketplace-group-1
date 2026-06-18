

-- =========================================================================
-- 1. ACTIVER LE RLS SUR TOUTES LES TABLES
-- =========================================================================
ALTER TABLE public.utilisateur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_support ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prix_tarif ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adresse ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.image_produit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonnement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ligne_commande ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_carrousel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.texte_general ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lien_produit_promo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lien_categorie_promo ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- 2. ACCÈS PUBLIC : CATALOGUE ET INFOS DU SITE (Visiteurs et Clients)
-- =========================================================================

-- Catalogue
CREATE POLICY "Catalogue : Produits visibles par tous"
ON public.produit
FOR SELECT
USING (statut_produit = true);
CREATE POLICY "Catalogue : Catégories visibles par tous" ON public.categorie FOR SELECT USING (true);
CREATE POLICY "Catalogue : Prix visibles par tous"
ON public.prix_tarif
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.produit
    WHERE produit.id_produit = prix_tarif.id_produit
      AND produit.statut_produit = true
  )
);
CREATE POLICY "Catalogue : Images visibles par tous"
ON public.image_produit
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.produit
    WHERE produit.id_produit = image_produit.id_produit
      AND produit.statut_produit = true
  )
);

-- Promotions et Codes Promos (Nécessaire pour le calcul panier côté Front)
CREATE POLICY "Catalogue : Promotions visibles par tous"
ON public.promotion
FOR SELECT
USING (
  is_actif = true
  AND date_expiration > now()
);
/*A faire avec un compte back end et serveur
CREATE POLICY "Catalogue : Codes promos visibles par tous" ON public.code_promo FOR SELECT USING (true);
*/
CREATE POLICY "Catalogue : Liens Promo-Produit visibles"
ON public.lien_produit_promo
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.promotion
    WHERE promotion.id_promotion = lien_produit_promo.id_promotion
      AND promotion.is_actif = true
      AND promotion.date_expiration > now()
  )
);
CREATE POLICY "Catalogue : Liens Promo-Catégorie visibles"
ON public.lien_categorie_promo
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.promotion
    WHERE promotion.id_promotion = lien_categorie_promo.id_promotion
      AND promotion.is_actif = true
      AND promotion.date_expiration > now()
  )
);

-- Contenu éditorial du site
CREATE POLICY "Visiteurs : Voir le carrousel actif" ON public.image_carrousel FOR SELECT USING (est_actif = true);
CREATE POLICY "Visiteurs : Voir les textes généraux" ON public.texte_general FOR SELECT USING (true);


-- =========================================================================
-- 3. ACCÈS PUBLIC : CHATBOT & SUPPORT INVITE
-- =========================================================================
CREATE POLICY "Support : Tout le monde peut envoyer un message" 
ON public.ticket_support FOR INSERT 
WITH CHECK (true);


-- =========================================================================
-- 4. ACCÈS PRIVÉ : UTILISATEUR CONNECTÉ (Clients)
-- =========================================================================
/*
CREATE POLICY "Client : Créer son profil à l'inscription"
ON public.utilisateur
FOR INSERT
WITH CHECK (auth.uid() = id_compte);*/
CREATE POLICY "Client : Voir son profil" ON public.utilisateur FOR SELECT USING (auth.uid() = id_compte);
-- verifer utilitée CREATE POLICY "Client : Modifier son profil" ON public.utilisateur FOR UPDATE USING (auth.uid() = id_compte);

-- Carnet d'adresses
CREATE POLICY "Client : Voir ses adresses" ON public.adresse FOR SELECT USING (auth.uid() = id_compte);
CREATE POLICY "Client : Ajouter une adresse" ON public.adresse FOR INSERT WITH CHECK (auth.uid() = id_compte);
CREATE POLICY "Client : Modifier son adresse" ON public.adresse FOR UPDATE USING (auth.uid() = id_compte);
CREATE POLICY "Client : Supprimer son adresse" ON public.adresse FOR DELETE USING (auth.uid() = id_compte);

-- Historique et Abonnements 
CREATE POLICY "Client : Voir ses abonnements" ON public.abonnement FOR SELECT USING (auth.uid() = id_compte);

-- Commandes et Factures (Un utilisateur voit ses factures via son abonnement OU via son email de profil s'il était invité)
CREATE POLICY "Client : Voir ses commandes et factures" 
ON public.commande FOR SELECT 
USING (
    id_commande IN (SELECT id_commande FROM public.abonnement WHERE id_compte = auth.uid())
    OR 
    mail_utilisateur_invite = (SELECT adresse_mail FROM public.utilisateur WHERE id_compte = auth.uid())
);

-- Détails des lignes de commandes
CREATE POLICY "Client : Voir le détail de ses factures" 
ON public.ligne_commande FOR SELECT 
USING (
    id_commande IN (SELECT id_commande FROM public.abonnement WHERE id_compte = auth.uid())
    OR
    id_commande IN (
        SELECT id_commande FROM public.commande 
        WHERE mail_utilisateur_invite = (SELECT adresse_mail FROM public.utilisateur WHERE id_compte = auth.uid())
    )
);

-- Support
CREATE POLICY "Client : Voir l'historique de ses tickets" ON public.ticket_support FOR SELECT USING (auth.uid() = id_compte);


-- =========================================================================
-- 5. ACCÈS BACKOFFICE : ADMINISTRATEURS
-- =========================================================================

CREATE POLICY "Admin : Gérer les produits" ON public.produit FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les catégories" ON public.categorie FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les prix" ON public.prix_tarif FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les promotions" ON public.promotion FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les codes promos" ON public.code_promo FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les textes du site" ON public.texte_general FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer le carrousel" ON public.image_carrousel FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les liaisons produit-promo" ON public.lien_produit_promo FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les liaisons categorie-promo" ON public.lien_categorie_promo FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les images produits" ON public.image_produit FOR ALL USING (public.est_admin());

-- Dashboard des ventes, clients et support global
CREATE POLICY "Admin : Voir et gérer tous les profils" ON public.utilisateur FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Voir toutes les adresses" ON public.adresse FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Voir toutes les commandes" ON public.commande FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Voir le détail de toutes les lignes" ON public.ligne_commande FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Voir tous les abonnements" ON public.abonnement FOR ALL USING (public.est_admin());
CREATE POLICY "Admin : Gérer les tickets support" ON public.ticket_support FOR ALL USING (public.est_admin());