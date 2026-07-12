# CYNA — application web

Marketplace pédagogique bilingue construite avec Next.js 16, React 19, Supabase, Stripe Checkout et Gemini. Les paiements, abonnements, produits et factures sont des données de démonstration.

## Installation

Prérequis : Node.js 20+, npm, un projet Supabase et un compte Stripe de test.

```bash
cd webapp-cyna
npm install
npm run dev
```

Le serveur Next.js doit être lancé depuis `webapp-cyna`. La racine Turbopack est
également fixée dans `next.config.ts` afin que les manifestes de routes et la
résolution CSS ne dépendent pas du dépôt parent.

Créer `.env.local` avec :

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
# Optionnel : configuration Stripe Portal existante. Sans cette valeur,
# l'application réutilise ou crée une configuration sûre à la première ouverture.
STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID=
GEMINI_API_KEY=
```

Ne jamais exposer les clés `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` ou `STRIPE_WEBHOOK_SECRET` au navigateur.

## Base de données

`supabase/migrations/20260712235959_latest_schema.sql` est l'unique schéma de
référence. Il décrit uniquement la structure finale (tables, contraintes,
index, fonctions, triggers et RLS) et ne contient ni seed ni transformation de
données.

Ce fichier est destiné à une installation vide. **Ne pas l'exécuter sur le
projet Supabase peuplé existant**, dont le schéma a déjà été appliqué
manuellement et dont le registre de migrations est vide.

Créer séparément les buckets Storage suivants :

- `product-images`, `category-images` et `carousel-images` en lecture publique ;
- `invoice-pdf` privé, utilisé uniquement via le service role et des URL signées.

Après déploiement de la migration et du webhook, les anciennes factures Stripe peuvent être récupérées volontairement avec :

```bash
npm run invoices:backfill
```

Cette commande écrit dans la base et le bucket configurés par `.env.local`. Elle n'est jamais lancée automatiquement.

Les fichiers de `supabase/seeds/development` sont non idempotents, contiennent
des identifiants de démonstration et ne doivent jamais être exécutés sur un
environnement partagé ou de production.

### Types Supabase

`src/types/database.types.ts` est généré et ne doit pas être modifié à la main.

```bash
# Après la création d'une base locale vide avec le schéma final
npm run db:types
npm run db:types:check

# Vérification explicite après déploiement sur le projet lié
npm run db:types:linked
npm run db:types:check:linked
```

Toute migration doit inclure la régénération des types. La vérification locale
est la référence CI ; la génération liée sert à détecter une dérive après
déploiement.

## Stripe en local

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Reporter le secret `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET`. Le webhook traite notamment :

- `checkout.session.completed` ;
- `invoice.finalized` et `invoice.paid` ;
- `invoice.payment_failed` et `invoice.voided`.
- `customer.subscription.updated` et `customer.subscription.deleted`.

En démonstration/déploiement, créer également un endpoint Stripe actif vers
`https://<domaine>/api/webhooks/stripe` avec ces événements, puis définir son
secret de signature dans `STRIPE_WEBHOOK_SECRET`. Sans endpoint, Stripe encaisse
le paiement mais la commande reste `En attente`, le stock n'est pas finalisé et
les lignes de `facture` ne sont pas créées. Stripe CLI ne couvre que les tests
locaux pendant l'exécution de `stripe listen`.

Carte de test Stripe : `4242 4242 4242 4242`, date future et CVC quelconque.

## Vérification

```bash
npm run build
npm run lint
```

Le build de production est la vérification de référence. Le dépôt contient encore des erreurs ESLint préexistantes principalement dans le back-office ; les fichiers du parcours utilisateur modifiés doivent rester propres au lint ciblé.

## Architecture

- `src/app/[locale]/(public)` : pages publiques et espace client ;
- `src/app/api/webhooks/stripe` : finalisation des commandes, stock, abonnements et factures ;
- `src/lib` : accès Supabase/Stripe, panier, support et règles métier ;
- `src/messages` : traductions françaises et anglaises ;
- `supabase/migrations` : schéma, RLS et fonctions SQL.
- `supabase/seeds/development` : données locales non destinées à la production ;
- `scripts/maintenance` : opérations manuelles, jamais lancées au déploiement.

## Sécurité et périmètre

Le projet utilise les sessions Supabase, des actions serveur, les signatures de webhook Stripe et un bucket privé pour les PDF. Il reste un prototype scolaire et ne revendique aucune certification, disponibilité, souveraineté d'hébergement ou aptitude à protéger un système réel. Le back-office n'est pas couvert par la passe de finition utilisateur actuelle.
