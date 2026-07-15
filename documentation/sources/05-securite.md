---
title: Plan de sécurité
subtitle: Menaces, contrôles, confidentialité et réponse à incident CYNA
reference: CYNA-SEC-002
version: 2.0
date: 15 juillet 2026
status: Plan opérationnel et risques résiduels
audience: Équipe technique, sécurité, DPO, exploitation et jury
---

# Objectifs et périmètre

Le plan protège la confidentialité des comptes, conversations, tickets et données commerciales, l'intégrité du catalogue et des transactions, ainsi que la disponibilité des parcours essentiels. Il couvre le code Next.js, Supabase, Stripe, Gemini, Netlify, GitHub et Sentry. Les contrôles des fournisseurs restent partagés : CYNA doit configurer les accès, secrets, alertes et durées de conservation même lorsque l'infrastructure est managée.

| Classe | Exemples | Exigence |
|---|---|---|
| Publique | catalogue, catégories, traductions, médias marketing | Intégrité et disponibilité |
| Interne | configuration tarifaire, promotions, métriques agrégées | Accès limité à l'application et aux admins |
| Personnelle | profil, e-mail, adresse, tickets, conversations | Finalité, minimisation, droits et rétention |
| Financière indirecte | commande, statut, facture, identifiants Stripe, dernier 4 | Forte intégrité ; aucune donnée carte complète dans CYNA |
| Secret | clés service role, Stripe, Gemini, Sentry upload | Stockage plateforme, rotation et moindre privilège |

# Frontières de confiance et menaces

![Contexte et frontières de confiance](../diagrammes/01-architecture.png)

Le navigateur est non fiable. Netlify exécute le code CYNA et détient les secrets serveur. Supabase accepte des appels publics contraints par RLS et des appels service role privilégiés. Stripe devient fiable pour un événement uniquement après vérification cryptographique de la signature sur le corps brut. Gemini est un sous-traitant de génération recevant des tours minimisés. Sentry reçoit des événements après filtrage.

<!-- landscape-start -->

| Menace | Vecteur | Impact | Contrôles actuels | Risque résiduel / action |
|---|---|---|---|---|
| Usurpation client | cookie volé, callback détourné | Accès au compte | HTTPS, cookies Supabase, PKCE, `next` assaini | Surveiller sessions ; documenter révocation |
| Élévation admin | rôle côté client, session AAL1 | BackOffice et données | rôle/activité serveur, MFA TOTP AAL2, RLS | Tester chaque nouvelle action sensible |
| IDOR | identifiant commande/ticket/conversation | Fuite ou mutation croisée | propriété vérifiée, requêtes filtrées, RLS | Ajouter tests d'intégration systématiques |
| Falsification paiement | montant client ou faux webhook | Produit non payé, fraude | prix relu serveur, signature Stripe, RPC idempotente | Suivre commandes abandonnées et incohérences |
| Replay webhook | événement réémis | doublon commande/facture | upserts, IDs uniques, finalisation réentrante | Tester concurrence et replay sur staging |
| Injection prompt | texte demande d'ignorer les règles | mauvaise réponse ou exfiltration | instruction système, outils fermés, projections minimales | Rate limit, tests adversariaux, limite de taille |
| Déni chatbot | volume, messages immenses, boucle outils | coût et indisponibilité | boucle 4 rounds | Pas de rate limiting ; priorité haute |
| Fuite observabilité | corps, cookie, auth dans erreur | données personnelles/secrets | filtre `beforeSend`, PII off, pas de replay/log | Tester les nouveaux SDK/intégrations |
| Supply chain | paquet npm ou Action compromis | exécution de code | lockfile, npm ci, audit high, Dependabot | Épingler/réviser changements sensibles |
| Compromission secret | variable copiée ou loggée | accès fournisseur | secrets Netlify/GitHub, aucun secret Git | Rotation testée et inventaire trimestriel |
| Indisponibilité fournisseur | Supabase/Stripe/Gemini/Netlify | parcours partiel ou total | erreurs contrôlées, retries Stripe, rollback Netlify | Définir SLO et procédures fournisseur |

<!-- landscape-end -->

# Gestion des identités et accès

## Clients et administrateurs

Supabase Auth est la source d'identité. `utilisateur` complète l'identité par les attributs métier ; il ne remplace pas les contrôles Auth. Une session client AAL1 suffit aux données personnelles ordinaires, sous réserve des politiques RLS. Le BackOffice exige un profil actif avec `role=admin`. Les fonctions les plus sensibles et le rapport commerce exigent AAL2 TOTP.

![Chaîne de contrôle MFA](../diagrammes/06-seq-mfa.png)

Les comptes administrateurs doivent être nominatifs, protégés par MFA et révisés au moins trimestriellement. Un départ ou changement de fonction déclenche désactivation du profil, révocation des sessions et retrait des accès GitHub, Netlify, Supabase, Stripe, Sentry et Google AI. Les comptes de plateforme partagés sont proscrits quand une identité nominative est possible.

## RBAC, RLS et service role

Le RBAC applicatif décide des capacités. La RLS limite les lignes à `auth.uid()` et forme une seconde barrière. Les opérations publiques utilisent la clé anon ; les opérations authentifiées utilisent la session. `SUPABASE_SERVICE_ROLE_KEY` contourne la RLS et n'est autorisée que dans des modules serveur délimités. Toute nouvelle utilisation doit documenter sa preuve d'entrée et ses filtres de propriété.

Contrôles de revue :

- aucune importation d'un client service role dans un Client Component ;
- aucune autorisation fondée uniquement sur un paramètre `role` ou un élément masqué ;
- politiques RLS activées sur chaque table exposée ;
- tests avec propriétaire, autre utilisateur, anonyme et administrateur ;
- fonctions `security definer` minimales, `search_path` maîtrisé et exécution accordée explicitement.

# Secrets et configuration

Les secrets vivent dans les variables chiffrées des plateformes et ne sont ni copiés dans les DOCX ni imprimés dans la CI. `.env.exemple` utilise des marqueurs fictifs. Les previews doivent employer des clés de test isolées. `SENTRY_AUTH_TOKEN` et les clés Stripe live sont limités au contexte Netlify Production.

| Secret | Détenteur | Rotation / révocation | Détection d'usage anormal |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Netlify Production | rotation projet et redéploiement | logs Supabase et changements inattendus |
| `STRIPE_SECRET_KEY` | Netlify Production | rotation Stripe, double clé si possible | Dashboard et alertes Stripe |
| `STRIPE_WEBHOOK_SECRET` | Netlify Production | recréer endpoint ou secret | taux de signatures invalides |
| `GEMINI_API_KEY` | Netlify par contexte | rotation Google AI | quotas et pics de consommation |
| `SENTRY_AUTH_TOKEN` | build Production | révocation et jeton minimal | audit Sentry |

Un secret suspecté compromis est révoqué avant l'analyse exhaustive. Le nouveau secret est déployé, les services sont testés, puis la fenêtre d'exposition et les journaux sont analysés. Les commits ne sont pas « nettoyés » comme seule mesure : une valeur présente dans Git est considérée divulguée.

# Sécurité Stripe et commerce

![Frontière de confiance du checkout et du webhook](../diagrammes/05-seq-checkout.png)

La création Checkout relit prix et produits côté serveur. La carte bancaire reste dans les surfaces Stripe ; CYNA ne stocke que marque et quatre derniers chiffres lorsqu'ils sont disponibles. Le webhook refuse toute signature manquante ou invalide avant d'instancier une écriture privilégiée. Les événements valides en erreur répondent 500 afin d'obtenir un retry.

Les métadonnées Stripe ne sont pas une autorisation en elles-mêmes. `id_commande` doit être un entier positif et `id_compte` est normalisé. La finalisation et les upserts doivent tolérer un replay et une concurrence raisonnable. Une réconciliation régulière compare commandes payées, abonnements, factures et événements Stripe. Une divergence ne se corrige pas par une modification manuelle non tracée.

Les PDFs de facture sont stockés dans un bucket privé. Les URLs signées éventuelles doivent être courtes et émises après autorisation. Le rapport administrateur utilise `private, no-store` et exige AAL2.

# Sécurité du chatbot et protection des données

## Données et propriété

Un invité reçoit un cookie aléatoire HTTP-only, SameSite Lax, Secure en production. Seul son hash SHA-256 est persistant. Un compte authentifié utilise `auth.users.id`; une conversation est rattachée à l'un ou l'autre et sa reprise vérifie cette propriété. Le contenu des tours est conservé pour le service et le support pendant 90 jours. La purge doit être planifiée et contrôlée.

Gemini reçoit les messages nécessaires au tour et les réponses compactes d'outils. `search_products` et `list_categories` travaillent sur le catalogue public. `open_support_form` ne remet que l'e-mail courant et les libellés de commandes autorisées au composant ; le modèle reçoit une confirmation minimale. Les métadonnées persistées excluent arguments et réponses brutes.

## Prompt injection et abus

L'instruction système limite CynAI à CYNA, au catalogue, à la cybersécurité et au support. Les quatre outils sont fermés et n'acceptent pas de SQL, URL arbitraire ou nom de table. Les réponses produit sont ancrées dans les résultats réels. Le nombre de rounds est limité à quatre et le nombre de cartes est limité.

Ces contrôles ne constituent pas un pare-feu complet contre l'abus. Il manque un rate limiting par session/IP, des quotas métier, une limite explicite stricte de taille et des tests adversariaux automatisés. En attendant, les quotas fournisseurs et alertes de consommation doivent être activés ; un pic peut justifier la désactivation temporaire de `GEMINI_API_KEY` ou du widget.

## Escalade support

Le chatbot n'enregistre pas librement une commande fournie par l'utilisateur. Le formulaire propose seulement les commandes retournées par le service de propriété. La création de ticket valide à nouveau la commande et l'identité. Les agents BackOffice accèdent à l'historique selon leur rôle et leur MFA ; cet accès doit être justifié par le support.

# Observabilité respectueuse de la vie privée

Sentry est désactivé sans DSN. En production, `sendDefaultPii` vaut false, le taux de traces vaut zéro et replay/logs sont absents. `beforeSend` retire l'objet user, les corps, cookies, autorisations, `Set-Cookie`, clés API et en-têtes privés, indépendamment de la casse. Les captures explicites ajoutent uniquement des tags de zone, d'étape et de type d'événement.

Une évolution du SDK, l'ajout d'un breadcrumb ou d'un nouvel enrichissement réseau exige de rejouer le test de confidentialité. Les événements de recette doivent employer des données fictives. Sentry aide au diagnostic technique ; il n'est ni un entrepôt d'audit ni un outil de profilage utilisateur.

# Dépendances, CI et chaîne de livraison

![Contrôles de la chaîne de livraison](../diagrammes/08-ci-observabilite.png)

La CI utilise un lockfile, `npm ci`, Node 24 et des permissions GitHub minimales. Elle bloque lint, tests, vulnérabilités production hautes/critiques et build. Le statut `CI / quality` doit être requis sur `dev` et `prod`. Dependabot propose les mises à jour npm et GitHub Actions vers `dev`; les majors restent séparées pour une revue explicite.

Le graphe de dépendances, les alertes et mises à jour de sécurité GitHub doivent être activés manuellement. Une alerte haute ou critique en production est triée immédiatement : exposition réelle, correctif non majeur, test, preview puis release. `npm audit fix --force` est interdit sans analyse, car il peut imposer une rupture majeure. Les actions tierces doivent rester limitées et leurs mises à jour relues.

Les previews ne reçoivent pas les secrets live. Le passage production se fait par PR `dev → prod`, CI et preview vertes, validation humaine et possibilité de restaurer le déploiement Netlify précédent.

# RGPD et cycle de vie

| Finalité | Données | Base / justification | Conservation cible | Droit / action |
|---|---|---|---|---|
| Compte et contrat | identité, commandes, factures | contrat et obligations | selon obligations légales et contrat | accès, rectification, restrictions applicables |
| Support | e-mail, ticket, messages, commande liée | assistance contractuelle ou demande | politique support à formaliser | accès, rectification, effacement selon contraintes |
| CynAI | tours, locale, cartes/outils résumés | service demandé et amélioration opérationnelle | 90 jours | purge automatique et traitement de demande |
| Sécurité | audit MFA, erreurs filtrées | intérêt légitime sécurité | durée minimale documentée par plateforme | accès restreint et suppression planifiée |

CYNA doit tenir un registre des traitements, contractualiser les sous-traitants, préciser les transferts éventuels et publier une information utilisateur cohérente. Une demande d'accès ou d'effacement doit rechercher les données Supabase, Storage et, selon la fenêtre, Sentry. Les données soumises aux obligations de facturation peuvent devoir être conservées ou pseudonymisées plutôt qu'effacées.

# Réponse à incident

## Qualification et confinement

1. Ouvrir un incident horodaté, désigner le responsable et préserver les preuves pertinentes.
2. Qualifier disponibilité, intégrité, confidentialité, comptes touchés et services fournisseurs.
3. Confinement : restaurer un déploiement, désactiver une intégration, révoquer une clé ou bloquer un compte selon la cause.
4. Vérifier les événements Stripe en attente avant toute conclusion financière.
5. Corriger sur branche, faire passer CI et preview, puis déployer sous validation.
6. Contrôler la récupération et surveiller les régressions.
7. Documenter cause racine, fenêtre, données, actions et prévention.

## Niveaux indicatifs

| Niveau | Exemple | Réponse initiale |
|---|---|---|
| SEV-1 | fuite de secret production, paiement incohérent massif, accès admin non autorisé | immédiate, confinement prioritaire, direction/DPO selon cas |
| SEV-2 | parcours checkout indisponible, fuite limitée suspectée, perte de données | moins d'une heure ouvrée, équipe technique mobilisée |
| SEV-3 | erreur localisée avec contournement, vulnérabilité non exploitée | planification rapide et suivi |
| SEV-4 | anomalie documentaire ou amélioration de durcissement | backlog priorisé |

Une violation de données personnelles est évaluée avec le DPO. Si elle crée un risque pour les personnes, la notification à l'autorité compétente et, si nécessaire, aux personnes doit respecter les délais légaux applicables. Ce plan ne remplace pas un avis juridique.

# Vérifications et risques résiduels

La revue de release vérifie absence de secret dans Git, variables par contexte, politiques RLS, compte admin AAL2, signature/replay webhook, bucket facture privé, filtre Sentry, audit high, Dependabot et smoke test. Une erreur contrôlée doit être visible et nettoyée dans Sentry.

Risques résiduels prioritaires : rate limiting et tailles chat, couverture E2E/API, planification prouvée de la purge 90 jours, restauration Supabase testée, revue exhaustive RLS après chaque migration, SLO et astreinte formalisés, et durée légale précise de chaque catégorie de donnée. Ils doivent être suivis dans le backlog avec propriétaire et échéance.
