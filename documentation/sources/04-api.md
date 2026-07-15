---
title: Documentation API
subtitle: Routes HTTP, streaming, webhooks et frontières Server Actions
reference: CYNA-API-002
version: 2.0
date: 15 juillet 2026
status: Contrats techniques réels
audience: Développeurs frontend/backend, intégrateurs et recette
---

# Conventions générales

L'application expose cinq routes HTTP dans `src/app/api`. Elles utilisent le runtime Next.js et le même domaine que le storefront. Les Server Actions, fonctions Supabase et appels internes ne sont pas des endpoints publics et sont documentés séparément. Les exemples utilisent `https://cyna.example` comme hôte fictif.

| Route | Méthode | Authentification | Réponse principale |
|---|---|---|---|
| `/api/search` | GET | Publique | JSON de suggestions |
| `/api/auth/callback` | GET | Code PKCE Supabase | Redirection 3xx |
| `/api/admin/sales/report` | GET | Session admin active et AAL2 | PDF ou erreur JSON |
| `/api/chat` | POST | Publique ; session facultative | NDJSON stream |
| `/api/webhooks/stripe` | POST | Signature Stripe | JSON d'acquittement |

Les réponses d'erreur ne doivent pas contenir de stack trace, secret, cookie ou détail de paiement. La locale valide vaut `fr` ou `en`; lorsqu'une route applique un repli, `fr` est la valeur par défaut. Les dates de rapport utilisent le format attendu par `createReportRange` et sont validées côté serveur.

# Recherche catalogue

## GET /api/search

Cette route alimente la recherche rapide de l'en-tête. Elle réutilise le moteur de catalogue public, puis réduit le résultat à six suggestions.

| Paramètre | Type | Obligatoire | Règle |
|---|---|---|---|
| `q` | string | non | Espaces supprimés ; sous la longueur minimale, résultat vide |
| `locale` | `fr` ou `en` | non | Locale inconnue remplacée par la locale par défaut |

Exemple :

```http
GET /api/search?q=edr&locale=fr HTTP/1.1
Host: cyna.example
Accept: application/json
```

Réponse 200 :

```json
{
  "results": [
    {
      "id_produit": 42,
      "nom_pro": "Endpoint Defense",
      "cat_nom": "EDR",
      "priceCents": 4900,
      "type_facturation": "monthly",
      "est_disponible": true
    }
  ]
}
```

Le schéma exact d'une suggestion suit `SearchSuggestion`. Une absence de résultat ou une requête trop courte répond 200 avec `{"results":[]}`. Une défaillance non interceptée de Supabase suit le traitement d'erreur Next.js et est capturable par `onRequestError`; le client doit considérer tout statut non 2xx comme une recherche indisponible, sans boucle agressive.

Effets de bord : aucun. Cache applicatif : aucun contrat public de cache n'est garanti par cette route.

# Callback d'authentification

## GET /api/auth/callback

Cette route termine le flux PKCE Supabase. Le navigateur y est redirigé avec un code temporaire. Elle échange ce code contre une session puis redirige vers une destination interne assainie.

| Paramètre | Type | Obligatoire | Règle |
|---|---|---|---|
| `code` | string | oui pour réussir | Code à usage court fourni par Supabase |
| `locale` | string | non | `en` est conservé ; toute autre valeur devient `fr` |
| `next` | string | non | Chemin interne validé par `sanitizeAuthNext`; `/` par défaut |

```http
GET /api/auth/callback?code=<opaque>&locale=fr&next=%2Ffr%2Faccount HTTP/1.1
```

| Situation | Réponse | Effet |
|---|---|---|
| Code valide | Redirection vers le chemin interne autorisé | Cookies de session Supabase établis |
| Code absent, expiré ou rejeté | Redirection vers `/{locale}/login?error=invalidLink` | Pas de session valide |
| `next` externe ou dangereux | Redirection vers un chemin sûr | Empêche l'open redirect |

La route ne renvoie pas de JSON. Les consommateurs ne doivent pas tenter d'analyser le corps et ne doivent jamais journaliser le code.

# Rapport commerce administrateur

## GET /api/admin/sales/report

La route produit un fichier PDF privé à partir des commandes et abonnements. Elle impose trois contrôles : utilisateur Supabase présent, profil `utilisateur` actif avec `role=admin`, puis niveau d'assurance `aal2`.

| Paramètre | Valeurs | Défaut | Description |
|---|---|---|---|
| `locale` | `fr`, `en` | `fr` | Langue du rapport |
| `preset` | `7d`, `30d`, `90d`, `ytd`, `custom` | `30d` | Fenêtre de vente |
| `from` | date | Non | Début requis ou utilisé pour `custom` |
| `to` | date | Non | Fin requise ou utilisée pour `custom` |
| `horizon` | `7`, `30`, `60`, `90` | `30` | Horizon abonnements en jours |

```http
GET /api/admin/sales/report?preset=custom&from=2026-07-01&to=2026-07-15&horizon=30&locale=fr HTTP/1.1
Cookie: <session Supabase>
```

Succès 200 : `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="CYNA-report-<from>_<to>.pdf"` et `Cache-Control: private, no-store`.

| Statut | Corps JSON | Cause |
|---|---|---|
| 400 | `{"error":"INVALID_RANGE"}` | Dates absentes, invalides ou ordre incohérent |
| 401 | `{"error":"UNAUTHENTICATED"}` | Aucun utilisateur de session |
| 403 | `{"error":"FORBIDDEN"}` | Profil absent, inactif ou non administrateur |
| 403 | `{"error":"AAL2_REQUIRED"}` | MFA non vérifié pour la session courante |
| 500 | `{"error":"<code ou message>"}` | Agrégation ou rendu PDF impossible |

Une erreur autre que `INVALID_RANGE` est envoyée à Sentry avec `area=commerce-report` et `stage=render-pdf`. Le PDF et les données commerciales ne sont pas mis en cache partagé.

# Chatbot CynAI

## POST /api/chat

La route accepte une conversation et diffuse une réponse Gemini enrichie de cartes. Elle utilise le runtime Node.js. Le corps doit être du JSON UTF-8.

```json
{
  "conversationId": "uuid facultatif renvoyé au tour précédent",
  "locale": "fr",
  "messages": [
    { "role": "user", "content": "Je cherche une solution EDR" },
    { "role": "assistant", "content": "Quel est votre besoin principal ?" },
    { "role": "user", "content": "Protection de 20 postes" }
  ]
}
```

| Champ | Type | Règle actuelle |
|---|---|---|
| `conversationId` | string facultative | Reprise seulement si propriété compte ou hash invité vérifiée |
| `locale` | string facultative | Locale reconnue, sinon défaut |
| `messages` | tableau de `ChatTurn` | Au moins un message et un dernier tour utilisateur non vide |
| `role` | `user` ou `assistant` | Toute autre valeur est traitée comme utilisateur par la conversion actuelle |
| `content` | string | Les contenus vides sont ignorés pour Gemini |

Réponses avant streaming :

| Statut | Corps texte | Cause |
|---|---|---|
| 400 | `Invalid JSON body` | Corps non JSON |
| 400 | `No messages provided` | Tableau absent ou vide |
| 400 | `No user message provided` | Aucun tour utilisateur non vide |
| 503 | `Chat history unavailable` | Conversation non résolue ou persistance du tour impossible |

Succès : statut 200, `Content-Type: application/x-ndjson; charset=utf-8`, `Cache-Control: no-store`. Chaque ligne est un objet JSON complet terminé par `\n`; le client doit tolérer qu'un chunk réseau contienne une ligne partielle ou plusieurs lignes.

```json
{"type":"conversation","id":"1af4c6d8-..."}
{"type":"text","value":"Voici trois solutions adaptées."}
{"type":"card","card":{"kind":"product","items":[{"id_produit":42,"nom_pro":"Endpoint Defense"}]}}
{"type":"done"}
```

Union des événements :

| Type | Propriétés | Cardinalité et ordre |
|---|---|---|
| `conversation` | `id` | Premier événement d'un stream ouvert |
| `text` | `value` | Zéro ou plusieurs fragments dans l'ordre Gemini |
| `card` | `card` | Zéro ou plusieurs ; produits/catégories révélés un par un |
| `done` | aucune | Fin normale |
| `error` | `message` | Fin en erreur après ouverture ; remplace `done` |

Cartes :

| `kind` | Charge utile | Action |
|---|---|---|
| `product` | `items: SearchSuggestion[]` | Ouvrir une fiche produit |
| `category` | catégories `{id_categorie, cat_nom}` | Ouvrir le catalogue filtré |
| `support` | aucune | Ouvrir Aide et support |
| `login` | aucune | Inviter à se connecter ; type prévu côté client |
| `ticketForm` | `email`, `orders` | Saisir sujet/détails et lier une commande autorisée |

### Outils Gemini

| Outil | Paramètres | Limite | Effet de bord |
|---|---|---|---|
| `search_products` | `query?`, `categoryId?` | 3 produits | Lecture catalogue public |
| `list_categories` | aucun | 3 cartes, total signalé | Lecture catégories publiques |
| `show_support_page` | aucun | 1 carte | Aucun |
| `open_support_form` | aucun | 1 carte | Lecture des options de commande du compte |

La boucle d'outils est bornée à quatre rounds. Les cartes sont diffusées avant que Gemini ne reformule éventuellement le résultat. Le dernier tour utilisateur et la réponse assistant sont persistés. Les métadonnées assistant ne contiennent que les noms d'outils et le résumé des cartes. En erreur, le tour partiel est marqué `status=error` lorsque la persistance reste disponible, puis un message générique est diffusé.

### Cookie et propriété

La réponse positionne `cyna_chat_guest` si nécessaire : HTTP-only, path `/`, SameSite Lax, Secure en production et durée 90 jours. Le serveur stocke `SHA-256(cookie)`, jamais la valeur brute. Pour un client connecté, l'identité Auth détermine la propriété. Un `conversationId` d'un autre propriétaire est refusé ou remplacé selon la logique de résolution, sans fuite d'historique.

### Limites du contrat actuel

Il n'existe pas encore de rate limiting dédié, de limite explicite stricte sur le nombre et la taille cumulée des messages, ni de version dans l'URL. Le client perd actuellement le `conversationId` au rechargement. Les intégrateurs doivent donc éviter de considérer cette API comme une API publique stable et ne pas envoyer de secrets ou données de santé dans le chat.

![Flux complet de l'API chat](../diagrammes/07-seq-chatbot.png)

# Webhook Stripe

## POST /api/webhooks/stripe

Le webhook reçoit le corps brut Stripe et l'en-tête `stripe-signature`. Il vérifie la signature avec `STRIPE_WEBHOOK_SECRET` avant toute mutation. Il utilise le service role Supabase après cette frontière de confiance.

```http
POST /api/webhooks/stripe HTTP/1.1
Stripe-Signature: t=...,v1=...
Content-Type: application/json

<corps brut signé par Stripe>
```

| Événement | Traitement |
|---|---|
| `checkout.session.completed` | Met à jour commande, snapshot de facturation, moyen de paiement, finalise la commande, mémorise client Stripe et synchronise abonnement |
| `customer.subscription.updated` | Upsert de la projection `abonnement` |
| `customer.subscription.deleted` | Synchronisation de l'état résilié |
| `subscription_schedule.updated/released/completed/canceled/aborted` | Résout l'abonnement puis synchronise son état |
| `invoice.finalized/paid/payment_failed/voided` | Résout compte/commande, stocke éventuellement le PDF et upsert `facture` |
| Autre | Acquitté sans effet |

| Statut | JSON | Sémantique Stripe |
|---|---|---|
| 200 | `{"received":true}` | Événement traité ou ignoré volontairement |
| 400 | `{"error":"Missing signature"}` | Signature ou secret absent |
| 400 | `{"error":"<validation>"}` | Signature invalide ; aucune mutation |
| 500 | `{"received":false}` | Erreur après validation ; Stripe doit réessayer |

L'idempotence repose sur l'identifiant commande, `finalize_paid_order`, les identifiants Stripe uniques et les upserts. Le stockage PDF utilise `upsert=true` mais ne télécharge pas à nouveau si `storage_path` existe. Les erreurs de signature sont journalisées localement sans capture explicite Sentry afin de réduire le bruit ; une erreur de traitement valide est capturée avec le type d'événement, sans corps ni en-têtes sensibles.

![Traitement webhook et réconciliation](../diagrammes/05-seq-checkout.png)

# Server Actions et interfaces internes

Les opérations suivantes ne sont pas des routes HTTP publiques malgré leur invocation depuis l'interface : mutations panier, création de session Checkout, ouverture du Customer Portal, profil et adresses, factures, tickets, administration du catalogue et contenus. Next.js sérialise leurs appels, mais leur contrat est interne au frontend et peut évoluer avec la branche.

Règles d'implémentation :

- toute Server Action authentifie et autorise de nouveau ; elle ne fait pas confiance à l'état React ;
- les identifiants et montants entrants sont relus ou validés côté serveur ;
- les erreurs attendues utilisent des codes métier ; les exceptions inattendues sont observables sans données privées ;
- les actions sensibles admin exigent profil actif, rôle admin et AAL2 ;
- les réponses ne retournent que les champs nécessaires au composant.

# RPC et dépendances de données

Les RPC Supabase, notamment `finalize_paid_order` et la purge des conversations expirées, sont des interfaces internes de persistance. Elles sont versionnées par migrations et ne doivent pas être appelées depuis un client non autorisé. Leur signature exacte se vérifie dans les migrations et `database.types.ts`. Toute modification exige migration, régénération des types, tests idempotence et mise à jour de cette documentation.

# Compatibilité, tests et observabilité

Les routes ne portent pas encore de préfixe `/v1`; leur stabilité est celle du produit. Un changement incompatible doit être coordonné avec le seul client officiel, ajouté à la matrice de tests et documenté. La couverture unitaire actuelle vérifie largement les services de domaine mais reste limitée au niveau des routes chat et webhook. Les priorités sont les tests de parsing NDJSON, propriété de conversation, signatures et replay Stripe, statuts du rapport et callback malveillant.

Sentry couvre les erreurs Next.js non interceptées via `onRequestError` et les flux interceptés critiques par capture explicite. Le filtre retire `request.data`, cookies, autorisation, en-têtes privés et utilisateur. Aucun consommateur ne doit utiliser Sentry comme journal d'audit financier : Stripe, Supabase et les tables métier restent les sources d'audit.
