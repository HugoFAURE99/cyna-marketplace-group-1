CREATE UNIQUE INDEX IF NOT EXISTS ticket_support_one_open_mfa_reset_per_account
  ON public.ticket_support (id_compte)
  WHERE categorie = 'mfa_reset'
    AND status NOT IN ('resolved', 'closed')
    AND id_compte IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.mfa_reset_audit (
  id_audit uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.utilisateur(id_compte) ON DELETE RESTRICT,
  target_id uuid NOT NULL REFERENCES public.utilisateur(id_compte) ON DELETE RESTRICT,
  ticket_id uuid NOT NULL REFERENCES public.ticket_support(id_support) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed')),
  factor_count integer NOT NULL DEFAULT 0 CHECK (factor_count >= 0),
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CHECK (actor_id <> target_id)
);

CREATE INDEX IF NOT EXISTS mfa_reset_audit_target_created_idx
  ON public.mfa_reset_audit(target_id, created_at DESC);

ALTER TABLE public.mfa_reset_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin : Consulter les audits MFA"
ON public.mfa_reset_audit FOR SELECT
USING (public.est_admin());

CREATE OR REPLACE FUNCTION public.upsert_technical_characteristic(
  p_id integer,
  p_label_fr text,
  p_label_en text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  characteristic_id integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.est_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF length(btrim(coalesce(p_label_fr, ''))) = 0
     OR length(btrim(coalesce(p_label_en, ''))) = 0 THEN
    RAISE EXCEPTION 'TRANSLATIONS_REQUIRED' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.caracteristique_technique candidate
    JOIN public.caracteristique_technique_traduction fr
      ON fr.id_caracteristique = candidate.id_caracteristique AND fr.langue = 'fr'
    JOIN public.caracteristique_technique_traduction en
      ON en.id_caracteristique = candidate.id_caracteristique AND en.langue = 'en'
    WHERE candidate.id_caracteristique IS DISTINCT FROM p_id
      AND lower(btrim(fr.nom_caracteristique)) = lower(btrim(p_label_fr))
      AND lower(btrim(en.nom_caracteristique)) = lower(btrim(p_label_en))
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_CHARACTERISTIC' USING ERRCODE = '23505';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.caracteristique_technique DEFAULT VALUES
    RETURNING id_caracteristique INTO characteristic_id;
  ELSE
    SELECT id_caracteristique INTO characteristic_id
    FROM public.caracteristique_technique
    WHERE id_caracteristique = p_id
    FOR UPDATE;
    IF characteristic_id IS NULL THEN
      RAISE EXCEPTION 'CHARACTERISTIC_NOT_FOUND' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  INSERT INTO public.caracteristique_technique_traduction (
    id_caracteristique,
    langue,
    nom_caracteristique
  )
  VALUES
    (characteristic_id, 'fr', btrim(p_label_fr)),
    (characteristic_id, 'en', btrim(p_label_en))
  ON CONFLICT (id_caracteristique, langue)
  DO UPDATE SET nom_caracteristique = EXCLUDED.nom_caracteristique;

  RETURN characteristic_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.replace_product_technical_characteristics(
  p_product_id integer,
  p_characteristic_ids integer[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supplied_count integer;
  distinct_count integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.est_admin() THEN
    RAISE EXCEPTION 'ADMIN_REQUIRED' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.produit WHERE id_produit = p_product_id
  ) THEN
    RAISE EXCEPTION 'PRODUCT_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  SELECT count(*), count(DISTINCT id)
  INTO supplied_count, distinct_count
  FROM unnest(coalesce(p_characteristic_ids, ARRAY[]::integer[])) AS ids(id);
  IF supplied_count <> distinct_count THEN
    RAISE EXCEPTION 'DUPLICATE_CHARACTERISTIC' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM unnest(coalesce(p_characteristic_ids, ARRAY[]::integer[])) AS ids(id)
    LEFT JOIN public.caracteristique_technique c ON c.id_caracteristique = ids.id
    WHERE ids.id IS NULL OR c.id_caracteristique IS NULL
  ) THEN
    RAISE EXCEPTION 'CHARACTERISTIC_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM public.produit_caracteristique_technique
  WHERE id_produit = p_product_id;

  INSERT INTO public.produit_caracteristique_technique (
    id_produit,
    id_caracteristique,
    ordre_affichage
  )
  SELECT p_product_id, id, ordinality::integer - 1
  FROM unnest(coalesce(p_characteristic_ids, ARRAY[]::integer[]))
    WITH ORDINALITY AS ids(id, ordinality);
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_technical_characteristic(integer, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.replace_product_technical_characteristics(integer, integer[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_technical_characteristic(integer, text, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.replace_product_technical_characteristics(integer, integer[])
  TO authenticated, service_role;
