-- =========================================================================
-- 1. TABLES INDÉPENDANTES (Aucune dépendance à d'autres tables du schéma public)
-- =========================================================================

CREATE TABLE public.utilisateur (
    id_compte UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
    is_actif BOOLEAN DEFAULT true NOT NULL,
    nom_complet TEXT NOT NULL,
    adresse_mail TEXT NOT NULL UNIQUE,
    token_connexion_stripe TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL
);

CREATE TABLE public.categorie (
    id_categorie INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cat_nom TEXT NOT NULL,
    cat_description TEXT,
    lien_image_cat TEXT,
    ordre_affichage INTEGER DEFAULT 0
);

CREATE TABLE public.promotion (
    id_promotion INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    is_code_promo BOOLEAN DEFAULT false NOT NULL,
    type_remise VARCHAR(50) NOT NULL,
    valeur_remise NUMERIC NOT NULL,
    date_expiration TIMESTAMPTZ NOT NULL,
    is_actif BOOLEAN DEFAULT true NOT NULL,
    lien_image_promo TEXT
);

CREATE TABLE public.texte_general (
    id_texte INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    texte TEXT NOT NULL,
    emplacement_texte VARCHAR(100) NOT NULL
);

CREATE TABLE public.image_carrousel (
    id_image INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lien_image_caroussel TEXT NOT NULL,
    titre_image TEXT NOT NULL,
    description_image TEXT,
    est_actif BOOLEAN DEFAULT true NOT NULL
);


-- =========================================================================
-- 2. TABLES DÉPENDANTES - NIVEAU 1 (Dépendent uniquement des tables du Niveau 1)
-- =========================================================================

CREATE TABLE public.produit (
    id_produit INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_pro TEXT NOT NULL,
    pro_description TEXT,
    pro_carac_technique TEXT,
    quantite_produit INTEGER DEFAULT 0 NOT NULL,
    statut_produit BOOLEAN DEFAULT true NOT NULL,
    mis_avant BOOLEAN DEFAULT false NOT NULL,
    ordre_priorite INTEGER DEFAULT 0 NOT NULL,
    date_ajout TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    id_categorie INTEGER NOT NULL REFERENCES public.categorie(id_categorie),
    stripe_product_id TEXT UNIQUE
);

CREATE TABLE public.code_promo (
    id_code_promo INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lib_code VARCHAR(50) UNIQUE NOT NULL,
    is_actif BOOLEAN DEFAULT true NOT NULL,
    type_promo VARCHAR(50),
    id_promotion INTEGER UNIQUE NOT NULL REFERENCES public.promotion(id_promotion)
);

CREATE TABLE public.commande (
    id_commande INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    date_commande TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    montant_total NUMERIC NOT NULL,
    statut_commande VARCHAR(50) DEFAULT 'En attente' NOT NULL,
    url_facture TEXT,
    mail_utilisateur_invite TEXT,
    id_promotion INTEGER REFERENCES public.promotion(id_promotion)
);

CREATE TABLE public.ticket_support (
    id_support UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sujet TEXT NOT NULL,
    description TEXT,
    date_creation TIMESTAMPTZ DEFAULT NOW(),
    date_fermeture TIMESTAMPTZ,
    email_contact TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Ouvert',
    origine_chatbot BOOLEAN DEFAULT false,
    id_compte UUID REFERENCES public.utilisateur(id_compte)
);

CREATE TABLE public.adresse (
    id_adresse INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    prenom TEXT NOT NULL,
    nom TEXT NOT NULL,
    adresse TEXT NOT NULL,
    adresse_complement TEXT,
    code_postal VARCHAR(20) NOT NULL,
    ville TEXT NOT NULL,
    region TEXT NOT NULL,
    pays TEXT NOT NULL,
    telephone VARCHAR(50),
    type_adresse VARCHAR(50),
    is_deleted BOOLEAN DEFAULT false NOT NULL,
    id_compte UUID REFERENCES public.utilisateur(id_compte)
);

CREATE TABLE public.lien_categorie_promo (
    id_categorie INTEGER NOT NULL REFERENCES public.categorie(id_categorie),
    id_promotion INTEGER NOT NULL REFERENCES public.promotion(id_promotion),
    PRIMARY KEY (id_categorie, id_promotion)
);


-- =========================================================================
-- 3. TABLES DÉPENDANTES - NIVEAU 2 (Dépendent du Niveau 1 et 2)
-- =========================================================================

CREATE TABLE public.image_produit (
    id_image INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lien_image_produit TEXT NOT NULL,
    ordre_affichage INTEGER DEFAULT 0,
    id_produit INTEGER NOT NULL REFERENCES public.produit(id_produit)
);

CREATE TABLE public.prix_tarif (
    id_prix INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom_prix_tarif TEXT,
    unite VARCHAR(50),
    type_facturation VARCHAR(50) NOT NULL,
    prix INTEGER NOT NULL,
    stripe_price_id TEXT UNIQUE NOT NULL,
    id_produit INTEGER NOT NULL REFERENCES public.produit(id_produit)
);

CREATE TABLE public.lien_produit_promo (
    id_produit INTEGER NOT NULL REFERENCES public.produit(id_produit),
    id_promotion INTEGER NOT NULL REFERENCES public.promotion(id_promotion),
    PRIMARY KEY (id_produit, id_promotion)
);


-- =========================================================================
-- 4. TABLES DÉPENDANTES - NIVEAU 3 (Dépendent du Niveau 2 et inférieur)
-- =========================================================================

CREATE TABLE public.abonnement (
    id_abonnement INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    statut_abonnement VARCHAR(50) NOT NULL,
    date_debut TIMESTAMPTZ NOT NULL,
    date_fin TIMESTAMPTZ,
    id_prix INTEGER NOT NULL REFERENCES public.prix_tarif(id_prix),
    id_commande INTEGER NOT NULL REFERENCES public.commande(id_commande),
    id_compte UUID REFERENCES public.utilisateur(id_compte)
);

CREATE TABLE public.ligne_commande (
    id_prix INTEGER NOT NULL REFERENCES public.prix_tarif(id_prix),
    id_commande INTEGER NOT NULL REFERENCES public.commande(id_commande),
    id_promotion INTEGER REFERENCES public.promotion(id_promotion),
    quantite INTEGER DEFAULT 1 NOT NULL,
    prix_unitaire NUMERIC NOT NULL,
    sous_total NUMERIC NOT NULL,
    remise_unitaire_appliquee VARCHAR(50),
    taux_remise_donne VARCHAR(50),
    PRIMARY KEY (id_prix, id_commande)
);