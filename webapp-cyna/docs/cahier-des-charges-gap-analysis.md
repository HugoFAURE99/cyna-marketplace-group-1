# Analyse d'écart — cahier des charges CYNA

Audit du site web mis à jour au 15 juillet 2026 à partir de « A06 - SUP DE VINCI - Projet
fil rouge CYNA DEV », avec l'application Android et l'exigence de plusieurs
dépôts explicitement hors périmètre. Les numéros de page sont ceux du PDF.

## Lecture de l'exigence abonnement

La page 22 demande de pouvoir renouveler et résilier un abonnement, ajouter des
fonctionnalités et augmenter le nombre d'utilisateurs. Elle ne demande pas une
ligne `abonnement` par licence. Le modèle retenu est donc une ligne par service
(un item de souscription Stripe), avec `nombre_utilisateurs` égal à la quantité
Stripe. `ligne_commande.quantite` reste l'instantané immuable de l'achat initial.

Les pages 8 et 10 décrivent des services SaaS : le nombre d'utilisateurs n'est
pas un stock physique. `produit.est_disponible` porte désormais la disponibilité
commerciale et `quantite_produit` est conservé uniquement pour compatibilité de
déploiement.

## Matrice de conformité web

| Exigence | État | Priorité | Preuve dans le code / écart restant |
|---|---|---:|---|
| En-tête, navigation, recherche, changement FR/EN | Complet | — | `src/components/layout/public-header`, `src/i18n` |
| Pied de page avec contact et réseaux sociaux | Partiel | P2 | `src/components/layout/public-footer.tsx` existe, mais les liens contact/réseaux demandés ne sont pas complets. |
| Accueil : carrousel, catégories, produits mis en avant | Partiel | P2 | `src/app/[locale]/(public)/page.tsx`; les blocs existent, mais leur ordre ne suit pas exactement le document. |
| Page catégorie avec titre, description et produits | Manquant | P2 | Les catégories redirigent vers `search`; pas de page d'atterrissage éditoriale dédiée. |
| Fiche produit, visuels, description, caractéristiques, tarifs | Partiel | P2 | `src/app/[locale]/(public)/products/[id]/page.tsx`; seuls trois produits similaires sont affichés au lieu des six aléatoires demandés. |
| Recherche tolérante et filtres | Partiel | P2 | `src/lib/products/search-products.ts`; Fuse fournit la tolérance, mais la priorité exacte → 1 caractère → préfixe → contenu et l'objectif de 100 ms ne sont pas démontrés. |
| Panier, quantités d'utilisateurs et persistance | Complet | — | `src/lib/cart`, `src/components/cart`; limites 1–50. |
| Taxes visibles dans le panier | Manquant | P2 | Le panier calcule le sous-total mais n'affiche pas de calcul fiscal distinct. |
| Paiement Stripe et création de commande | Complet | — | `src/lib/checkout/checkout.action.ts`, `src/app/api/webhooks/stripe/route.ts`. |
| Confirmation avant achat et e-mail de commande dédié | Partiel | P2 | Stripe Checkout confirme le paiement et la page `order-confirmed` existe ; aucun e-mail CYNA dédié n'est envoyé. |
| Inscription, connexion, récupération du mot de passe | Partiel | P1 | `src/app/[locale]/(auth)`; politique de mot de passe et redirection vers la connexion avec retour à la page demandée restent à renforcer. |
| Profil : identité, mot de passe actuel et sécurité | Partiel | P1 | `src/app/[locale]/(public)/user-dashboard`; modification du nom et contrôle explicite du mot de passe actuel incomplets. |
| Adresses et moyen de paiement | Complet | — | `src/lib/account/address.actions.ts` et portail Stripe limité à la facturation. |
| Commandes et factures | Complet | — | `src/components/account/orders-list.tsx`, `billing-list.tsx`, table `facture` et bucket privé. |
| Abonnement : renouvellement, quantité d'utilisateurs, résiliation à l'échéance | Complet | — | Migration `20260713210000_subscription_management.sql`, `src/lib/stripe/subscription-management.action.ts`, webhook et cartes compte. |
| Mise à niveau des fonctionnalités / changement de formule | Manquant | P1 | Livraison actuelle limitée au nombre d'utilisateurs ; changement de tier et mensuel/annuel à planifier. |
| Support client et suivi des tickets | Partiel | P1 | Parcours client sous `user-dashboard/tickets`; traitement back-office et notifications administrateur manquants. |
| Back-office produits, catégories, promotions et accueil | Partiel | P0 | CRUD présent sous `src/app/[locale]/(admin)`, mais le layout ne vérifie pas encore le rôle et plusieurs actions utilisent le service role sans garde admin centralisée. |
| Back-office utilisateurs et sécurité 2FA | Manquant | P0 | Pas de 2FA et protections admin incomplètes. |
| Statistiques back-office | Partiel | P2 | Graphiques présents, sans preuve complète de conformité de chaque indicateur demandé. |
| Accessibilité clavier et responsive | Partiel | P1 | Composants responsive et dialogs accessibles ; audit WCAG global et tests automatisés manquants. |
| Internationalisation et RTL | Partiel | P2 | FR/EN via `next-intl`; aucune langue RTL ni inversion de mise en page. |
| Performance, sécurité, CI et supervision | Partiel | P1 | RLS, webhook signé, CI GitHub, audit des dépendances, Netlify et Sentry erreurs uniquement sont versionnés ; restent les budgets de performance, l’audit de sécurité exhaustif, les analytics et la configuration des services de production. |
| Application Android | Hors périmètre | — | Exclue de cette livraison. |
| Deux dépôts Git / livrables multi-repositories | Hors périmètre | — | Exclu selon la décision de cadrage. |

## Backlog recommandé

1. **P0 — verrouiller le back-office** : garde serveur admin partagée, suppression
   des usages service-role non autorisés, puis 2FA administrateur.
2. **P1 — compléter le cycle commercial** : changement de formule/fonctionnalités,
   gestion admin des tickets, sécurité du profil et audit WCAG.
3. **P2 — parité éditoriale** : pages catégorie, footer, taxes panier, six produits
   similaires, ordre d'accueil, recherche mesurée et RTL.

Les éléments « partiel » ne doivent pas être présentés comme conformes tant que
leur comportement n'est pas couvert par un test ou une preuve d'acceptation.
