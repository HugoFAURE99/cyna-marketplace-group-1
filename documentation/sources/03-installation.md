---
title: Guide d'installation et de déploiement
subtitle: Environnements locaux, services managés et exploitation CYNA
reference: CYNA-INS-002
version: 2.0
date: 15 juillet 2026
status: Procédure reproductible
audience: Développeurs, intégrateurs et exploitants
---

# Préparer l'environnement

## Prérequis

| Outil ou accès | Version / exigence | Usage |
|---|---|---|
| Git | version maintenue | Clonage, branches et PR |
| Node.js | 24, valeur de `.nvmrc` | Runtime local et CI |
| npm | livré avec Node 24 | Installation déterministe via lockfile |
| Supabase | projet et CLI facultative | PostgreSQL, Auth, RLS, Storage, migrations |
| Stripe | compte test puis production | Checkout, Billing, portail et webhooks |
| Google AI | clé Gemini | CynAI `gemini-3.1-flash-lite` |
| Sentry | projet Next.js CYNA | Erreurs production et source maps |
| Netlify | site relié au dépôt | Preview et production OpenNext |

Un poste de développement ne doit pas réutiliser les clés de production. Les comptes d'administration des plateformes doivent activer le MFA. Le dépôt ne contient aucun secret ; `.env.exemple` décrit seulement les noms et valeurs fictives.

## Cloner et installer

```powershell
git clone <url-du-depot>
cd cyna-marketplace-group-1
git switch dev
cd webapp-cyna
nvm use
npm ci
```

`npm ci` doit être préféré à `npm install` dans la CI et lors d'une reproduction : il respecte strictement `package-lock.json`. Node doit afficher une version 24.x. Les commandes applicatives sont lancées depuis `webapp-cyna`.

# Configurer les variables

Copier `webapp-cyna/.env.exemple` vers `.env.local`, puis remplacer uniquement les valeurs locales. Ne jamais committer `.env.local`.

<!-- landscape-start -->

| Variable | Local / Preview | Production | Sensibilité et rôle |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Projet de développement | Projet de production | Publique ; URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon du projet | Clé anon production | Publique mais contrôlée par RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Projet de test dédié | Production, serveur seulement | Critique ; contourne RLS |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | domaine canonique HTTPS | Publique ; retours et liens |
| `STRIPE_SECRET_KEY` | `sk_test_…` | `sk_live_…` | Critique ; API Stripe serveur |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` | `pk_live_…` | Publique |
| `STRIPE_WEBHOOK_SECRET` | secret Stripe CLI | secret endpoint production | Critique ; vérification webhook |
| `STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID` | config test | config production | Interne ; capacités portail |
| `GEMINI_API_KEY` | clé projet de test | clé production restreinte | Critique ; appels Gemini |
| `NEXT_PUBLIC_SENTRY_DSN` | vide ou projet test | projet CYNA production | Publique ; active le SDK |
| `SENTRY_ORG` | vide hors build sourcemaps | organisation Sentry | Interne |
| `SENTRY_PROJECT` | vide hors build sourcemaps | projet CYNA | Interne |
| `SENTRY_AUTH_TOKEN` | absent en développement | Netlify Production seulement | Critique ; upload source maps |

<!-- landscape-end -->

Sans `NEXT_PUBLIC_SENTRY_DSN`, les initialisations client, server et edge restent désactivées et l'application fonctionne. Les variables Sentry d'upload ne sont pas nécessaires à un build local. Les valeurs utilisées par la CI sont factices et non secrètes ; elles servent uniquement à compiler les branches sans contacter la production.

# Initialiser Supabase

## Projet, migrations et types

Créer ou sélectionner le projet correspondant à l'environnement. Appliquer les migrations dans leur ordre depuis le répertoire Supabase du dépôt. Ne pas modifier manuellement la production avant d'avoir testé la migration sur un clone ou un projet de staging.

```powershell
supabase login
supabase link --project-ref <reference>
supabase db push
supabase gen types typescript --linked > src/types/database.types.ts
```

La dernière commande de redirection est donnée à titre opératoire ; vérifier le diff avant commit. Le présent chantier ne requiert aucune migration. Une régénération de types ne doit pas supprimer une table ou rendre un champ obligatoire sans migration correspondante.

## Auth, URL et MFA

Dans Supabase Auth, configurer l'URL du site et les URLs de redirection pour `http://localhost:3000`, les previews Netlify autorisées et le domaine de production. Activer les méthodes de connexion prévues par le produit. Le BackOffice repose sur TOTP : vérifier que MFA est disponible et que l'administrateur peut atteindre AAL2. Créer le profil `utilisateur` associé et lui attribuer `role = admin` et `is_actif = true` par une procédure contrôlée.

## RLS, fonctions et Storage

Vérifier que la RLS est active sur les tables exposées et que les politiques client limitent les lignes par `auth.uid()`. Les fonctions comme `finalize_paid_order` et la purge de chat sont déployées avec les privilèges prévus par les migrations. Créer les buckets attendus, notamment `invoice-pdf`, avec une politique privée. Les médias publics ne doivent pas rendre le bucket de facture public par héritage.

Test minimal Supabase : inscription et callback, lecture catalogue anonyme, lecture d'une commande par son propriétaire, refus avec un autre compte, enrôlement TOTP et rapport refusé en AAL1 puis accepté en AAL2.

# Configurer Stripe

## Produits, prix et portail

Créer les produits et prix Stripe nécessaires, puis reporter les identifiants dans les tarifs CYNA selon le modèle de données. Les modes de facturation doivent correspondre aux scénarios Checkout. Créer une configuration Customer Portal et renseigner son identifiant dans `STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID`. Les capacités du portail (annulation, changement de moyen de paiement, factures) doivent être cohérentes avec les règles métier.

## Webhook local

```powershell
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
npm run dev
```

Copier le secret `whsec_…` fourni par Stripe CLI dans `.env.local`, redémarrer Next.js, puis déclencher au minimum `checkout.session.completed`, un événement d'abonnement et un événement de facture. Une signature absente ou invalide doit répondre 400 sans mutation. Une erreur de traitement après signature doit répondre 500 pour provoquer un retry.

## Webhook de production

Créer un endpoint HTTPS sur `https://<domaine>/api/webhooks/stripe` et abonner uniquement les événements gérés : checkout terminé, mises à jour/suppression d'abonnement, cycle des subscription schedules, finalisation/paiement/échec/annulation de facture. Placer le secret dans le contexte Netlify Production. Conserver la possibilité de rejouer un événement depuis Stripe Dashboard.

# Configurer Gemini et CynAI

Créer une clé Google AI affectée au projet CYNA, limiter son accès autant que la plateforme le permet et la placer dans `GEMINI_API_KEY`. L'application fixe le modèle `gemini-3.1-flash-lite`. Un test fonctionnel doit couvrir une réponse textuelle, une recherche de produit, la liste des catégories, le lien support et le formulaire de ticket.

Ne placer aucune donnée réelle de production dans un prompt de test. Le cookie invité n'est jamais transmis en clair à Gemini. La durée de conservation locale est 90 jours ; prévoir l'exécution régulière de la fonction de purge documentée dans le plan de maintenance.

# Configurer Sentry

Créer manuellement un projet JavaScript/Next.js nommé CYNA dans l'organisation choisie. Reporter le DSN dans `NEXT_PUBLIC_SENTRY_DSN`. Créer un jeton limité à l'upload des source maps et le stocker uniquement dans Netlify Production avec `SENTRY_ORG` et `SENTRY_PROJECT`. Configurer une alerte e-mail pour une nouvelle erreur et une régression.

L'intégration est en mode erreurs seules : aucun Session Replay, aucune trace de performance, aucun log et `sendDefaultPii: false`. Le filtre `beforeSend` supprime utilisateur, corps de requête, cookies, `Authorization`, `Cookie`, `Set-Cookie`, clés API et en-têtes privés. Déclencher une erreur contrôlée non sensible sur une preview ou production autorisée, vérifier son événement, ses tags et une stack trace lisible grâce aux source maps, puis retirer le déclencheur.

# Exécuter et vérifier localement

```powershell
npm run dev
npm run lint
npm test -- --run
npm audit --omit=dev --audit-level=high
npm run build
npm start
```

Le lint doit terminer sans avertissement. La suite de référence contient au moins 112 tests. L'audit bloquant interdit toute vulnérabilité haute ou critique en dépendances de production ; des avis modérés peuvent rester documentés lorsque leur correction dépend d'une mise à niveau amont non sûre. Le build doit réussir sans DSN Sentry.

# Déployer sur Netlify

![Topologie de déploiement](../diagrammes/02-deploiement.png)

1. Relier le dépôt au site Netlify et laisser `netlify.toml` définir base, commande, publication et Node 24.
2. Déclarer les variables par contexte. Utiliser des services de test pour Preview ; réserver clés live, DSN production et jeton Sentry au contexte Production.
3. Ouvrir un PR vers `dev`, attendre `CI / quality` et la preview verte, puis exécuter les tests fumée.
4. Après intégration et validation globale, ouvrir le PR contrôlé `dev → prod`. Ne pas activer de fusion automatique.
5. Vérifier le déploiement production, le webhook Stripe et Sentry. En cas d'échec, restaurer le déploiement Netlify précédent.

## Tests fumée de preview

| Zone | Vérification |
|---|---|
| Public | accueil FR/EN, catalogue, recherche et fiche produit |
| Auth | inscription ou compte de test, callback, connexion/déconnexion |
| Client | compte, adresses, commandes, abonnements et factures |
| CynAI | texte, produit, catégorie, support, ticket et NDJSON terminé |
| Stripe test | Checkout, retour, webhook, commande et facture |
| BackOffice | refus AAL1, accès AAL2, catalogue, ticket et rapport PDF |
| Observabilité | erreur contrôlée filtrée et source map lisible |

# Dépannage et retour arrière

| Symptôme | Diagnostic | Action sûre |
|---|---|---|
| Build refuse une variable | Lire la première exception serveur | Ajouter la valeur au bon contexte, jamais au dépôt |
| Callback revient au login | Vérifier URL, code expiré et redirects Supabase | Corriger la liste d'URLs puis relancer un nouveau lien |
| Checkout créé mais commande non finalisée | Examiner événements et réponses webhook Stripe | Corriger la cause puis rejouer l'événement signé |
| Facture sans PDF | Vérifier `invoice_pdf`, bucket et service role | Réconcilier l'événement après correction Storage |
| BackOffice redirige | Vérifier session, profil actif, rôle et AAL | Réenrôler TOTP ou corriger le profil par procédure |
| CynAI répond 503 | Persistance conversation indisponible | Vérifier migrations, service role et RLS/RPC |
| CynAI émet `error` | Examiner Sentry `area=chat` et disponibilité Gemini | Corriger quota/clé/réseau, ne pas exposer l'exception |
| Sentry reste vide | Vérifier DSN, contexte et filtre | Déclencher une erreur contrôlée sans PII |

Un rollback applicatif consiste à restaurer le dernier déploiement Netlify sain. Un rollback de données n'est jamais implicite : une migration déjà appliquée exige une stratégie corrective ou une restauration testée, validée avec son impact sur Stripe. Après rollback, rejouer le smoke test et vérifier les événements Stripe en attente avant de rouvrir le trafic normal.
