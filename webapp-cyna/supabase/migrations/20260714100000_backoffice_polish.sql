-- Additive schema changes required by the BackOffice polish release.
ALTER TABLE public.image_carrousel
  ADD COLUMN IF NOT EXISTS lien_bouton text;

ALTER TABLE public.image_carrousel_traduction
  ADD COLUMN IF NOT EXISTS texte_bouton text;

ALTER TYPE public.support_ticket_category
  ADD VALUE IF NOT EXISTS 'admin_access';

UPDATE public.utilisateur
SET role = CASE lower(btrim(role))
  WHEN 'admin' THEN 'admin'
  ELSE 'client'
END;

ALTER TABLE public.utilisateur
  ALTER COLUMN role SET DEFAULT 'client';

ALTER TABLE public.utilisateur
  DROP CONSTRAINT IF EXISTS utilisateur_role_check;

ALTER TABLE public.utilisateur
  ADD CONSTRAINT utilisateur_role_check CHECK (role IN ('client', 'admin'));
