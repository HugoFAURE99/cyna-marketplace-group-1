---
title: Plan de maintenance et d'exploitation
subtitle: Branches, déploiements, alertes, données et runbooks CYNA
reference: CYNA-MNT-002
version: 2.0
date: 15 juillet 2026
status: Procédure opérationnelle
audience: Mainteneurs, exploitants, développeurs et responsable produit
---

# Modèle d'exploitation

CYNA s'appuie sur des services managés mais conserve la responsabilité de la configuration, des releases, des secrets, de la supervision, des données et des reprises. Ce plan décrit la maintenance corrective, évolutive, préventive et de sécurité. Il suppose une branche d'intégration `dev` et une branche production `prod` protégées.

| Rôle | Responsabilités minimales |
|---|---|
| Mainteneur applicatif | Correctifs, tests, dépendances, documentation et revue |
| Responsable de release | Go/no-go, PR `dev → prod`, preview, rollback |
| Exploitant plateformes | Netlify, variables, Sentry, Supabase, Stripe et sauvegardes |
| Product Owner | Priorité fonctionnelle, critères d'acceptation, validation métier |
| Référent sécurité / DPO | Incidents, accès, secrets, vulnérabilités et données personnelles |

# Branches, CI et releases

## Flux Git

Une évolution part d'une branche courte `codex/...` ou `feature/...` et ouvre un PR vers `dev`. La CI et la preview doivent être vertes avant revue et fusion. `dev` agrège l'état candidat. Une release ouvre ensuite un PR explicite `dev → prod`; elle ne se fusionne jamais automatiquement. Une divergence importante de `prod` doit être examinée comme un lot de release et non résolue par un force push.

## Contrôle CI

Le workflow `CI` s'exécute sur PR et push vers `dev` et `prod`. Le job `quality` doit produire le statut stable `CI / quality` et devenir obligatoire dans les règles de branche. Il exécute Node 24 depuis `.nvmrc`, `npm ci`, lint, au moins 112 tests Vitest, audit production bloquant au niveau high, puis build avec variables factices.

![Pipeline de maintenance, déploiement et supervision](../diagrammes/08-ci-observabilite.png)

Les permissions GitHub restent en lecture, et les exécutions obsolètes sont annulées. Une baisse du nombre de tests est expliquée dans le PR. Un audit high/critical ne peut être contourné sans décision de sécurité documentée et mesure compensatoire.

## Checklist de release

1. Confirmer la portée et l'absence de fichiers parasites ou secrets.
2. Vérifier migration, compatibilité des variables et mise à jour documentaire.
3. Exiger `CI / quality` vert sur le commit exact.
4. Exécuter le smoke test sur la preview avec services de test.
5. Vérifier Sentry et les alertes fournisseurs avant le changement.
6. Faire approuver puis fusionner `dev → prod` manuellement.
7. Contrôler le déploiement Netlify et relancer le smoke test production.
8. Observer erreurs et événements Stripe pendant la fenêtre de surveillance.

# Déploiement Netlify et rollback

`netlify.toml` fixe la base `webapp-cyna`, le build `npm run build`, la publication `.next` et Node 24. Netlify utilise l'adaptateur OpenNext natif. Les previews reçoivent des variables de test ; les clés live, le DSN Sentry et le jeton source maps sont limités au contexte Production.

![Déploiement Netlify et dépendances externes](../diagrammes/02-deploiement.png)

## Smoke test

| Parcours | Résultat attendu |
|---|---|
| Accueil FR/EN | pages sans erreur, liens et contenus cohérents |
| Recherche | suggestions et résultats catalogue |
| Auth | callback, connexion, déconnexion et session |
| Client | profil, adresses, commandes, abonnements et factures |
| CynAI | conversation, texte, carte produit/catégorie, support et done |
| Stripe test | session, retour, webhook, finalisation et facture |
| BackOffice | MFA, gestion principale et rapport PDF |
| Sentry | erreur contrôlée filtrée avec source map lisible |

## Retour arrière

Si le nouveau déploiement provoque une régression critique, restaurer le dernier déploiement Netlify sain. Cette action restaure le code et sa configuration de build, pas les mutations de données déjà exécutées. Geler les nouvelles migrations et changements Stripe, vérifier les webhooks en échec, puis déterminer si une migration corrective est nécessaire.

Après restauration : relancer accueil, auth, recherche, checkout, webhook, compte, CynAI et rapport ; rejouer les événements Stripe sûrs ; vérifier Sentry ; communiquer l'état. Ne supprimer ni commande ni facture pour masquer une incohérence.

# Supervision et alertes

## Sentry

Le projet CYNA reçoit les erreurs client, serveur et edge seulement lorsque le DSN est défini. Il n'enregistre ni traces, replay, logs ni PII par défaut. Une alerte e-mail couvre au minimum nouvelle erreur et régression. Les tags `area` et `stage` aident à distinguer chatbot, webhook, checkout et rapport.

| Signal | Seuil indicatif | Première vérification |
|---|---|---|
| Nouvelle erreur checkout/webhook | toute occurrence production | type Stripe, déploiement, récurrence et données touchées |
| Hausse erreurs chat | plusieurs occurrences rapprochées | quota Gemini, clé, persistance et taille des demandes |
| Rapport PDF en erreur | occurrence répétée | période, données, mémoire et rendu React PDF |
| Erreur globale après release | apparition corrélée au deploy | stack source-mappée et diff release |

Les événements ne doivent pas contenir de corps, cookie, authorization ou utilisateur. Une vérification de confidentialité suit toute mise à niveau majeure du SDK Sentry.

## Fournisseurs

Netlify signale les builds et fonctions en échec. Supabase fournit l'état base/auth et les journaux. Stripe Dashboard montre livraisons webhook, retries, paiements et abonnements. Google AI expose quotas et consommation. GitHub signale CI, Dependabot et alertes de sécurité. Un incident peut nécessiter de corréler l'heure UTC et les identifiants techniques entre plusieurs plateformes sans copier de PII dans le ticket interne.

<!-- landscape-start -->

# Calendrier de maintenance

| Fréquence | Contrôles | Sortie attendue |
|---|---|---|
| À chaque PR | lint, tests, audit high, build, preview, diff secrets | statut CI vert et revue |
| Après release | smoke production, Sentry, Stripe, Netlify | validation ou rollback documenté |
| Quotidien ouvré | nouvelles erreurs, webhooks en échec, disponibilité fournisseurs | incidents triés |
| Hebdomadaire | PR Dependabot, vulnérabilités, erreurs récurrentes, purge chat | backlog mis à jour et purge vérifiée |
| Mensuel | réconciliation Stripe, restauration d'échantillon, quotas Gemini, coûts | rapport de contrôle |
| Trimestriel | accès admins/plateformes, secrets, RLS, rétention, dépendances majeures | revue d'accès et risque |
| Avant montée majeure | guide migration, tests E2E, preview, rollback | décision d'architecture |

<!-- landscape-end -->

# Base de données, migrations et sauvegardes

## Migration contrôlée

Une migration est additive lorsque possible, idempotente à son niveau et testée sur un environnement réaliste. Le PR inclut SQL, impact RLS, stratégie de backfill, compatibilité ancienne/nouvelle version et retour arrière. Après application, les types TypeScript sont régénérés et le dictionnaire des 28 tables est mis à jour.

Ordre recommandé : sauvegarde ou point de restauration vérifié, migration staging, tests d'autorisation et performance, déploiement du code compatible, migration production pendant la fenêtre prévue, smoke test, observation. Une suppression ou modification destructive nécessite une phase de dépréciation.

## Sauvegarde et restauration

Connaître la politique de sauvegarde effective du plan Supabase et la durée disponible ne suffit pas : une restauration doit être testée régulièrement dans un projet isolé. Le test vérifie schéma, données essentielles, RLS, fonctions, liens Storage et capacité de l'application à démarrer. Les clés d'environnement restauré restent de test.

| Incident données | Action |
|---|---|
| Migration échouée sans mutation partielle | arrêter, diagnostiquer, corriger avant reprise |
| Mutation partielle | ne pas rejouer aveuglément ; établir l'état et utiliser une correction idempotente |
| Suppression accidentelle | isoler, restaurer vers un environnement séparé, extraire et valider la reprise |
| Divergence Stripe | comparer par identifiants externes et événements, puis réconcilier |

# Exploitation Stripe

La réconciliation mensuelle compare les commandes finalisées, lignes, abonnements et factures avec Checkout, Billing et événements Stripe. Les scripts de backfill existants sont exécutés d'abord en lecture ou dry-run lorsqu'ils le permettent, avec un périmètre et une sauvegarde. Le résultat est contrôlé par échantillon et par totaux.

## Runbook webhook en échec

1. Identifier événement, type, heure, réponse HTTP et nombre de retries dans Stripe.
2. Vérifier le déploiement actif, Sentry `area=stripe-webhook` et Supabase.
3. Corriger la cause avec un test de replay sur staging.
4. Déployer par le flux normal ou en procédure incident validée.
5. Rejouer l'événement depuis Stripe ; confirmer réponse 200 et absence de doublon.
6. Contrôler commande, abonnement, facture, Storage et écran client.

## Runbook facture absente

Résoudre `stripe_invoice_id`, abonnement, compte et commande. Vérifier `invoice_pdf`, le bucket `invoice-pdf`, la clé service role et `storage_path`. Corriger puis rejouer l'événement de facture. Ne rendre le bucket public sous aucun prétexte de dépannage.

# Exploitation CynAI

La santé du chatbot se mesure par erreurs API, erreurs Gemini, coût, temps de réponse, persistance et création de tickets. Le contenu utilisateur ne sert pas de métrique brute dans Sentry. Les conversations et messages de plus de 90 jours sont purgés par la RPC prévue ; l'exploitation doit ordonnancer cet appel, enregistrer date, durée et nombre de lignes, puis alerter en cas d'échec.

## Runbook indisponibilité

| Symptôme | Vérifier | Action |
|---|---|---|
| Réponse 503 avant stream | Supabase, service role, conversation/RPC | restaurer persistance ; ne pas appeler Gemini sans historique fiable |
| Événement `error` | quota/clé Gemini, réseau, exception outil | corriger fournisseur ou outil ; afficher le message générique |
| Coût anormal | volume, taille des messages, boucle d'outils | limiter temporairement, révoquer clé si abus, prioriser rate limit |
| Fuite potentielle | prompt, métadonnées, Sentry, accès BackOffice | contenir, préserver preuve, lancer procédure sécurité |

Les limites techniques (pas de rate limiting, taille perfectible, conversation perdue au rechargement, tests API partiels) sont revues à chaque cycle. Le premier durcissement doit ajouter quotas, limite de taille, persistance locale sécurisée de l'identifiant et tests route/outils.

# Dépendances et obsolescence

Dependabot ouvre chaque semaine les mises à jour npm de `/webapp-cyna` vers `dev`, regroupe patchs/minors et sépare majors. Les GitHub Actions sont surveillées séparément. Une PR de dépendance passe toute la CI et la preview ; une montée de Next.js, React, Supabase, Stripe, Sentry ou Gemini exige la lecture des notes officielles et un test ciblé.

| Catégorie | Politique |
|---|---|
| Patch/minor | regrouper si risque compatible, tester et fusionner régulièrement |
| Major | PR isolée, plan de migration et rollback |
| Haute/critique production | triage immédiat, correctif non forcé préféré |
| Modérée transitive | documenter exposition et suivre l'amont |
| Action GitHub | vérifier provenance, permissions et changements de runtime |

`npm audit fix --force` n'est pas une routine. Le lockfile fait partie du changement et doit rester reproductible avec `npm ci`. Le graphe, les alertes et mises à jour de sécurité GitHub sont activés manuellement dans les paramètres du dépôt.

# Runbooks d'incident

## Déploiement cassé

Restaurer le deploy précédent si le parcours critique est touché. Capturer le commit, l'heure, la preview et l'erreur source-mappée. Corriger sur branche, exécuter CI et smoke, puis redéployer. Vérifier que la restauration n'a pas désynchronisé une migration ou un webhook.

## Secret compromis

Révoquer le secret, créer une valeur de remplacement, mettre à jour le bon contexte et redéployer. Examiner les journaux du fournisseur pendant la fenêtre, vérifier les données et informer sécurité/DPO. Un secret committé reste compromis même après suppression du fichier.

## Compte administrateur compromis

Désactiver `utilisateur.is_actif`, révoquer les sessions/facteurs, retirer les accès plateforme, préserver `mfa_reset_audit` et journaux, examiner les mutations BackOffice et réactiver uniquement après réenrôlement contrôlé.

## Incident de données personnelles

Contenir l'accès, identifier catégories, personnes, période et sous-traitants, préserver les preuves et associer le DPO. Évaluer notification réglementaire et communication. Après correction, vérifier suppression des copies de diagnostic et appliquer les actions préventives.

# Registre des limites et améliorations

| Priorité | Limite | Action attendue |
|---|---|---|
| P0 | Règles de branche et alertes GitHub à activer dans l'interface | Exiger `CI / quality`, graphe, alertes et security updates |
| P0 | Projet/alerte Sentry et secrets Production à créer | Valider erreur contrôlée et source maps |
| P1 | Rate limiting et tailles chatbot absents | Quotas, validation et tests d'abus |
| P1 | Tests API/E2E financiers partiels | Chat, webhook, checkout, rapport et auth |
| P1 | Purge chat non prouvée comme planifiée | Scheduler, alerte et preuve hebdomadaire |
| P1 | Restauration Supabase à éprouver | Exercice mensuel puis périodicité ajustée |
| P2 | Conversation client perdue au reload | Persistance locale sûre avec durée limitée |
| P2 | SLO et astreinte non formalisés | Définir objectifs, seuils et contacts |

Une maintenance est terminée lorsque le code, les tests, les procédures, les diagrammes et le registre de limites décrivent le même état. Les écarts découverts sont corrigés dans la même PR ou inscrits explicitement avec risque, propriétaire et échéance.
