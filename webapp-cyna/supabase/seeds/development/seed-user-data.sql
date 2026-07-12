-- DEVELOPMENT ONLY: addresses, orders, subscriptions for a fixed test user.
-- Run in Supabase SQL Editor

DO $$
DECLARE
  v_user_id UUID := 'b2dc5095-1e82-4a9a-8c4d-159bdb2a3dc8';
  v_prix_ids INTEGER[];
  v_prix_amounts NUMERIC[];
  v_id_commande INTEGER;
  v_prix_id INTEGER;
  v_prix_amount NUMERIC;
  v_total NUMERIC;
  v_idx INTEGER;
  v_id_abon INTEGER;
BEGIN
  -- Fetch available prix_tarif
  SELECT array_agg(id_prix), array_agg(prix)
  INTO v_prix_ids, v_prix_amounts
  FROM prix_tarif;

  IF v_prix_ids IS NULL OR array_length(v_prix_ids, 1) = 0 THEN
    RAISE NOTICE 'No prix_tarif found. Create products with prices first.';
    RETURN;
  END IF;

  -- ═══════════════════════════════
  -- ADDRESSES
  -- ═══════════════════════════════
  INSERT INTO adresse (id_compte, nom, prenom, adresse, code_postal, ville, region, pays, telephone, type_adresse, is_deleted) VALUES
    (v_user_id, 'Faure', 'Hugo', '12 Rue de la Paix', '75002', 'Paris', 'Île-de-France', 'France', '0612345678', 'livraison', false),
    (v_user_id, 'Faure', 'Hugo', '45 Avenue des Champs-Élysées', '75008', 'Paris', 'Île-de-France', 'France', '0612345678', 'facturation', false),
    (v_user_id, 'Faure', 'Hugo', '8 Rue du Commerce', '69002', 'Lyon', 'Auvergne-Rhône-Alpes', 'France', NULL, 'livraison', false);

  -- ═══════════════════════════════
  -- ORDER 1 — payee, 3 weeks ago
  -- ═══════════════════════════════
  v_idx := 1;
  v_prix_id := v_prix_ids[v_idx];
  v_prix_amount := v_prix_amounts[v_idx];
  v_total := v_prix_amount * 2;

  INSERT INTO commande (date_commande, montant_total, statut_commande, mail_utilisateur_invite)
  VALUES (NOW() - INTERVAL '21 days', v_total, 'payee', NULL)
  RETURNING id_commande INTO v_id_commande;

  INSERT INTO ligne_commande (id_commande, id_prix, prix_unitaire, quantite, sous_total)
  VALUES (v_id_commande, v_prix_id, v_prix_amount, 2, v_total);

  INSERT INTO abonnement (id_commande, id_compte, id_prix, date_debut, date_fin, statut_abonnement)
  VALUES (v_id_commande, v_user_id, v_prix_id, NOW() - INTERVAL '21 days', NOW() + INTERVAL '345 days', 'actif');

  -- ═══════════════════════════════
  -- ORDER 2 — active, 10 days ago
  -- ═══════════════════════════════
  v_idx := LEAST(2, array_length(v_prix_ids, 1));
  v_prix_id := v_prix_ids[v_idx];
  v_prix_amount := v_prix_amounts[v_idx];
  v_total := v_prix_amount * 1;

  INSERT INTO commande (date_commande, montant_total, statut_commande, mail_utilisateur_invite)
  VALUES (NOW() - INTERVAL '10 days', v_total, 'active', NULL)
  RETURNING id_commande INTO v_id_commande;

  INSERT INTO ligne_commande (id_commande, id_prix, prix_unitaire, quantite, sous_total)
  VALUES (v_id_commande, v_prix_id, v_prix_amount, 1, v_total);

  INSERT INTO abonnement (id_commande, id_compte, id_prix, date_debut, date_fin, statut_abonnement)
  VALUES (v_id_commande, v_user_id, v_prix_id, NOW() - INTERVAL '10 days', NOW() + INTERVAL '355 days', 'actif');

  -- ═══════════════════════════════
  -- ORDER 3 — echoue, 5 days ago
  -- ═══════════════════════════════
  v_idx := LEAST(3, array_length(v_prix_ids, 1));
  v_prix_id := v_prix_ids[v_idx];
  v_prix_amount := v_prix_amounts[v_idx];
  v_total := v_prix_amount * 1;

  INSERT INTO commande (date_commande, montant_total, statut_commande, mail_utilisateur_invite)
  VALUES (NOW() - INTERVAL '5 days', v_total, 'echoue', NULL)
  RETURNING id_commande INTO v_id_commande;

  INSERT INTO ligne_commande (id_commande, id_prix, prix_unitaire, quantite, sous_total)
  VALUES (v_id_commande, v_prix_id, v_prix_amount, 1, v_total);

  -- ═══════════════════════════════
  -- ORDER 4 — expire, 2 months ago
  -- ═══════════════════════════════
  v_idx := 1;
  v_prix_id := v_prix_ids[v_idx];
  v_prix_amount := v_prix_amounts[v_idx];
  v_total := v_prix_amount * 3;

  INSERT INTO commande (date_commande, montant_total, statut_commande, mail_utilisateur_invite)
  VALUES (NOW() - INTERVAL '60 days', v_total, 'expire', NULL)
  RETURNING id_commande INTO v_id_commande;

  INSERT INTO ligne_commande (id_commande, id_prix, prix_unitaire, quantite, sous_total)
  VALUES (v_id_commande, v_prix_id, v_prix_amount, 3, v_total);

  INSERT INTO abonnement (id_commande, id_compte, id_prix, date_debut, date_fin, statut_abonnement)
  VALUES (v_id_commande, v_user_id, v_prix_id, NOW() - INTERVAL '60 days', NOW() - INTERVAL '1 day', 'expire');

  -- ═══════════════════════════════
  -- ORDER 5 — en_cours, today
  -- ═══════════════════════════════
  v_idx := LEAST(2, array_length(v_prix_ids, 1));
  v_prix_id := v_prix_ids[v_idx];
  v_prix_amount := v_prix_amounts[v_idx];
  v_total := v_prix_amount * 1;

  INSERT INTO commande (date_commande, montant_total, statut_commande, mail_utilisateur_invite)
  VALUES (NOW(), v_total, 'en_cours', NULL)
  RETURNING id_commande INTO v_id_commande;

  INSERT INTO ligne_commande (id_commande, id_prix, prix_unitaire, quantite, sous_total)
  VALUES (v_id_commande, v_prix_id, v_prix_amount, 1, v_total);

  RAISE NOTICE 'Done: 3 addresses, 5 orders, 3 subscriptions for user %', v_user_id;
END $$;
