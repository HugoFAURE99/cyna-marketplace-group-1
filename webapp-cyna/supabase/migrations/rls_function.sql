-- =========================================================================
-- Outil : Fonction de sécurité pour vérifier le rôle Admin (Évite les boucles RLS)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.est_admin()
RETURNS boolean 
SECURITY DEFINER -- S'exécute avec les privilèges système (outrepasse la RLS utilisateur)
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.utilisateur 
    WHERE id_compte = auth.uid()
    AND role = 'admin'
    AND is_actif = true
  );
END;
$$ LANGUAGE plpgsql;
