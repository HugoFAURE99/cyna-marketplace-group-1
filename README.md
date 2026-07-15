# CYNA marketplace

Projet de Bachelor réalisé par une équipe de quatre étudiants de l’Institut Limayrac. CYNA est un prototype pédagogique de marketplace de logiciels de cybersécurité ; il ne fournit aucun service de sécurité réel.

L’application Next.js, les migrations Supabase et les commandes de développement se trouvent dans [`webapp-cyna`](./webapp-cyna/README.md). Les livrables fonctionnels, techniques, utilisateur et de test se trouvent dans [`documentation`](./documentation/README.md).

## Qualité, déploiement et supervision

- Node.js 24 est fixé dans `webapp-cyna/.nvmrc` pour le développement et la CI ;
- `.github/workflows/ci.yml` contrôle lint, tests Vitest, audit de production et build sur `dev` et `prod` ;
- Dependabot surveille npm et GitHub Actions chaque semaine ;
- `netlify.toml` décrit le build Netlify depuis `webapp-cyna`, avec Node.js 22 et `@netlify/plugin-nextjs` ;
- Sentry est intégré en mode erreurs uniquement, sans PII par défaut, et reste inactif sans DSN.

Les protections de branches, alertes Dependabot, variables Netlify et projet/alerte Sentry doivent être configurés dans les services concernés. Les secrets ne sont jamais versionnés.

## Limites assumées

- application web responsive uniquement, sans application mobile native ;
- site public et back-office réunis dans un seul dépôt ;
- paiements et factures utilisés en mode test Stripe ;
- aucune infrastructure SOC/EDR/XDR de production ;
- analytics et notifications e-mail applicatives non implémentés.
