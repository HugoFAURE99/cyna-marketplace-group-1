-- Correct the stock lock for databases that already applied the user-side
-- polish migration. PostgreSQL does not allow FOR UPDATE on an aggregate join.
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
