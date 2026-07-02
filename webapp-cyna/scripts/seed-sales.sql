-- Seed data for sales dashboard charts
-- Run this in the Supabase SQL Editor
-- Prerequisites: products and prix_tarif must already exist

DO $$
DECLARE
  v_id_commande INTEGER;
  v_date TIMESTAMP;
  v_prix_ids INTEGER[];
  v_prix_amounts NUMERIC[];
  v_picked_ids INTEGER[];
  v_random_idx INTEGER;
  v_prix_id INTEGER;
  v_prix_amount NUMERIC;
  v_qty INTEGER;
  v_total NUMERIC;
  v_status TEXT;
  v_num_lines INTEGER;
  v_max_lines INTEGER;
  i INTEGER;
  j INTEGER;
  already_used BOOLEAN;
  k INTEGER;
BEGIN
  SELECT array_agg(id_prix), array_agg(prix)
  INTO v_prix_ids, v_prix_amounts
  FROM prix_tarif;

  IF v_prix_ids IS NULL OR array_length(v_prix_ids, 1) = 0 THEN
    RAISE NOTICE 'No prix_tarif found. Create products with prices first.';
    RETURN;
  END IF;

  v_max_lines := LEAST(array_length(v_prix_ids, 1), 3);

  FOR i IN 1..40 LOOP
    v_date := NOW() - (random() * 35)::INTEGER * INTERVAL '1 day'
              - (random() * 12)::INTEGER * INTERVAL '1 hour';

    CASE (random() * 10)::INTEGER
      WHEN 0 THEN v_status := 'en_cours';
      WHEN 1 THEN v_status := 'echoue';
      WHEN 2 THEN v_status := 'expire';
      ELSE
        IF random() > 0.5 THEN v_status := 'payee';
        ELSE v_status := 'active';
        END IF;
    END CASE;

    v_total := 0;
    v_picked_ids := ARRAY[]::INTEGER[];
    v_num_lines := 1 + (random() * (v_max_lines - 1))::INTEGER;

    INSERT INTO commande (date_commande, montant_total, statut_commande)
    VALUES (v_date, 0, v_status)
    RETURNING id_commande INTO v_id_commande;

    FOR j IN 1..v_num_lines LOOP
      -- Pick a prix_id not already used in this order
      LOOP
        v_random_idx := 1 + (random() * (array_length(v_prix_ids, 1) - 1))::INTEGER;
        v_prix_id := v_prix_ids[v_random_idx];
        already_used := FALSE;
        IF array_length(v_picked_ids, 1) IS NOT NULL THEN
          FOR k IN 1..array_length(v_picked_ids, 1) LOOP
            IF v_picked_ids[k] = v_prix_id THEN already_used := TRUE; EXIT; END IF;
          END LOOP;
        END IF;
        EXIT WHEN NOT already_used;
      END LOOP;

      v_picked_ids := v_picked_ids || v_prix_id;
      v_prix_amount := v_prix_amounts[v_random_idx];
      v_qty := 1 + (random() * 3)::INTEGER;

      INSERT INTO ligne_commande (id_commande, id_prix, prix_unitaire, quantite, sous_total)
      VALUES (v_id_commande, v_prix_id, v_prix_amount, v_qty, v_prix_amount * v_qty);

      v_total := v_total + (v_prix_amount * v_qty);
    END LOOP;

    UPDATE commande SET montant_total = v_total WHERE id_commande = v_id_commande;
  END LOOP;

  RAISE NOTICE 'Created 40 test orders with line items.';
END $$;
