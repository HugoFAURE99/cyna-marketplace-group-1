-- Seed 10 test products for pagination testing
-- Uses the first category found in the database
-- Run with: psql <connection_string> -f scripts/seed-test-products.sql
-- Or paste into Supabase SQL Editor

DO $$
DECLARE
  cat_id INTEGER;
  prod_id INTEGER;
  i INTEGER;
  names TEXT[] := ARRAY[
    'CynaShield Pro',
    'CynaDetect XDR',
    'CynaVault Backup',
    'CynaGuard Firewall',
    'CynaScan Vulnerability',
    'CynaSOC Monitor',
    'CynaEDR Endpoint',
    'CynaNet Analyzer',
    'CynaAuth MFA',
    'CynaLog SIEM'
  ];
  descriptions TEXT[] := ARRAY[
    'Protection avancée contre les menaces',
    'Détection et réponse étendue',
    'Sauvegarde sécurisée des données',
    'Pare-feu nouvelle génération',
    'Scan de vulnérabilités automatisé',
    'Centre opérationnel de sécurité',
    'Protection des endpoints',
    'Analyse du trafic réseau',
    'Authentification multi-facteurs',
    'Gestion centralisée des logs'
  ];
  monthly_prices INTEGER[] := ARRAY[2900, 4900, 1900, 3900, 2400, 7900, 3400, 2900, 1400, 5900];
  annual_prices  INTEGER[] := ARRAY[29000, 49000, 19000, 39000, 24000, 79000, 34000, 29000, 14000, 59000];
  stripe_prod TEXT;
  stripe_monthly TEXT;
  stripe_annual TEXT;
BEGIN
  SELECT id_categorie INTO cat_id FROM public.categorie LIMIT 1;
  IF cat_id IS NULL THEN
    RAISE EXCEPTION 'No category found. Create at least one category first.';
  END IF;

  FOR i IN 1..10 LOOP
    stripe_prod    := 'prod_test_seed_' || i;
    stripe_monthly := 'price_test_seed_m_' || i;
    stripe_annual  := 'price_test_seed_a_' || i;

    INSERT INTO public.produit (
      id_categorie, statut_produit, stripe_product_id, quantite_produit
    ) VALUES (
      cat_id, true, stripe_prod, 100
    ) RETURNING id_produit INTO prod_id;

    INSERT INTO public.produit_traduction (id_produit, langue, nom_pro, pro_description)
    VALUES
      (prod_id, 'fr', names[i], descriptions[i]),
      (prod_id, 'en', names[i], descriptions[i]);

    INSERT INTO public.prix_tarif (id_produit, type_facturation, prix, stripe_price_id)
    VALUES
      (prod_id, 'mensuel', monthly_prices[i], stripe_monthly),
      (prod_id, 'annuel',  annual_prices[i],  stripe_annual);
  END LOOP;

  RAISE NOTICE '10 test products created in category %', cat_id;
END $$;
