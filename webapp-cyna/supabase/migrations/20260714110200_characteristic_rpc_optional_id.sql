-- Describe create mode accurately to PostgREST/type generation: callers may
-- omit p_id, while the function keeps validating both translated labels.
CREATE OR REPLACE FUNCTION public.upsert_technical_characteristic(
  p_id integer DEFAULT NULL,
  p_label_fr text DEFAULT NULL,
  p_label_en text DEFAULT NULL
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

REVOKE ALL ON FUNCTION public.upsert_technical_characteristic(integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_technical_characteristic(integer, text, text)
  TO authenticated, service_role;
