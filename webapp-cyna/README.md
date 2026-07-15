# CYNA — application web

Marketplace pédagogique bilingue construite avec Next.js 16, React 19, Supabase, Stripe Checkout et Gemini. Les paiements, abonnements, produits et factures sont des données de démonstration.

## Installation

Prérequis : Node.js 24, npm, un projet Supabase et un compte Stripe de test.

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
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

Ne jamais exposer les clés `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` ou `STRIPE_WEBHOOK_SECRET` au navigateur.

## Base de données

`supabase/migrations/20260712235959_latest_schema.sql` est le schéma de base pour
une installation vide. Les migrations horodatées suivantes sont additives ;
`20260713210000_subscription_management.sql` ajoute notamment le miroir des
items Stripe, le nombre d'utilisateurs et la disponibilité commerciale SaaS.

Ce fichier est destiné à une installation vide. **Ne pas l'exécuter sur le
projet Supabase peuplé existant**, dont le schéma a déjà été appliqué
manuellement et dont le registre de migrations est vide.

Pour réparer ce registre sans rejouer le schéma de base, vérifier d'abord la
cible liée puis marquer uniquement la base comme déjà appliquée :

```bash
supabase link --project-ref <project-ref>
supabase migration list --linked
supabase migration repair 20260712235959 --status applied --linked
supabase db push --linked
```

La dernière commande applique alors uniquement les migrations additives non
enregistrées. Ces commandes modifient le projet distant : elles sont à exécuter
manuellement après sauvegarde et revue de `supabase migration list`.

Créer séparément les buckets Storage suivants :

- `product-images`, `category-images` et `carousel-images` en lecture publique ;
- `invoice-pdf` privé, utilisé uniquement via le service role et des URL signées.

Après déploiement de la migration et du webhook, les anciennes factures Stripe peuvent être récupérées volontairement avec :

```bash
npm run invoices:backfill
```

Cette commande écrit dans la base et le bucket configurés par `.env.local`. Elle n'est jamais lancée automatiquement.

Les anciens abonnements se prévisualisent d'abord sans écriture, puis se
synchronisent explicitement après revue du rapport :

```bash
npm run subscriptions:backfill
npm run subscriptions:backfill -- --apply
```

Le rapport signale les prix Stripe non mappés, les lignes ambiguës et les
abonnements sans contexte de commande. Ne jamais lancer `--apply` avant d'avoir
résolu ces éléments.

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
- `subscription_schedule.updated`, `released`, `completed`, `canceled` et `aborted`.

En démonstration/déploiement, créer également un endpoint Stripe actif vers
`https://<domaine>/api/webhooks/stripe` avec ces événements, puis définir son
secret de signature dans `STRIPE_WEBHOOK_SECRET`. Sans endpoint, Stripe encaisse
le paiement mais la commande reste `En attente`, l'abonnement n'est pas synchronisé et
les lignes de `facture` ne sont pas créées. Stripe CLI ne couvre que les tests
locaux pendant l'exécution de `stripe listen`.

Le portail client Stripe configuré par CYNA gère uniquement le profil de
facturation, les moyens de paiement et les factures. La résiliation Stripe et
la mise à jour d'abonnement doivent rester désactivées dans toute configuration
fournie via `STRIPE_CUSTOMER_PORTAL_CONFIGURATION_ID`, car CYNA gère les items
des abonnements multi-services avec ses propres contrôles authentifiés.

Carte de test Stripe : `4242 4242 4242 4242`, date future et CVC quelconque.

## Vérification

```bash
npm run build
npm run lint
npm test -- --run
npm audit --omit=dev --audit-level=high
```

La CI GitHub exécute ces contrôles sur les pushes et pull requests vers `dev` et `prod`. Le statut stable à protéger est `CI / quality`. Le lint du dépôt est propre ; la suite Vitest contient 112 tests au moment de cette documentation.

Le déploiement Netlify est décrit par le `netlify.toml` racine. Sentry capture uniquement les erreurs si `NEXT_PUBLIC_SENTRY_DSN` est défini ; les traces, replays, logs et PII par défaut sont désactivés. Réserver le DSN et le jeton de source maps au contexte Production Netlify.

## Architecture

- `src/app/[locale]/(public)` : pages publiques et espace client ;
- `src/app/api/webhooks/stripe` : finalisation des commandes, abonnements et factures ;
- `src/lib` : accès Supabase/Stripe, panier, support et règles métier ;
- `src/messages` : traductions françaises et anglaises ;
- `supabase/migrations` : schéma, RLS et fonctions SQL.
- `supabase/seeds/development` : données locales non destinées à la production ;
- `scripts/maintenance` : opérations manuelles, jamais lancées au déploiement.
- `.github/workflows/ci.yml` : lint, tests, audit de production et build ;
- `../documentation` : sources Markdown/Mermaid et six livrables DOCX V2.

## Sécurité et périmètre

Le projet utilise les sessions Supabase, des actions serveur, les signatures de webhook Stripe et un bucket privé pour les PDF. Il reste un prototype scolaire et ne revendique aucune certification, disponibilité, souveraineté d'hébergement ou aptitude à protéger un système réel. Le back-office n'est pas couvert par la passe de finition utilisateur actuelle.
