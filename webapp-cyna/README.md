# CYNA — application web

Marketplace pédagogique bilingue construite avec Next.js 16, React 19, Supabase, Stripe Checkout et Gemini. Les paiements, abonnements, produits et factures sont des données de démonstration.

## Installation

Prérequis : Node.js 20+, npm, un projet Supabase et un compte Stripe de test.

```bash
npm install
npm run dev
```

Créer `.env.local` avec :

```dotenv
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
GEMINI_API_KEY=
```

Ne jamais exposer les clés `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY` ou `STRIPE_WEBHOOK_SECRET` au navigateur.

## Base de données

Appliquer les migrations de `supabase/migrations` dans l'ordre. La migration `20260712090000_user_side_polish.sql` ajoute :

- la propriété et la session Stripe des commandes ;
- la finalisation transactionnelle et idempotente du stock ;
- les adresses de facturation par défaut ;
- la relation ticket–commande ;
- l'historique des factures initiales et de renouvellement.

Après déploiement de la migration et du webhook, les anciennes factures Stripe peuvent être récupérées volontairement avec :

```bash
npm run invoices:backfill
```

Cette commande écrit dans la base et le bucket configurés par `.env.local`. Elle n'est jamais lancée automatiquement.

## Stripe en local

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Reporter le secret `whsec_…` affiché dans `STRIPE_WEBHOOK_SECRET`. Le webhook traite notamment :

- `checkout.session.completed` ;
- `invoice.finalized` et `invoice.paid` ;
- `invoice.payment_failed` et `invoice.voided`.

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

## Sécurité et périmètre

Le projet utilise les sessions Supabase, des actions serveur, les signatures de webhook Stripe et un bucket privé pour les PDF. Il reste un prototype scolaire et ne revendique aucune certification, disponibilité, souveraineté d'hébergement ou aptitude à protéger un système réel. Le back-office n'est pas couvert par la passe de finition utilisateur actuelle.
