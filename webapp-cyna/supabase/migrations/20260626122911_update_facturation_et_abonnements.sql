-- 1. On ajoute la colonne pour l'e-mail de l'invité
ALTER TABLE public.adresse ADD COLUMN mail_utilisateur_invite text;

-- 2. On rend la région optionnelle pour éviter les crashs avec Stripe
ALTER TABLE public.adresse ALTER COLUMN region DROP NOT NULL;

-- On ajoute l'identifiant unique de l'abonnement Stripe
ALTER TABLE public.abonnement ADD COLUMN stripe_subscription_id text UNIQUE;