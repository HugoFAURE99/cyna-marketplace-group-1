# Documentation CYNA

Ce répertoire contient uniquement les livrables documentaires finaux du projet CYNA.

## Livrables

| Fichier | Contenu |
|---|---|
| `1 - SFD_Specification_fonctionnelle.docx` | spécifications fonctionnelles et règles métier |
| `2 - DAT_Architecture_technique.docx` | architecture, sécurité, données, déploiement et décisions techniques |
| `3 - Guide_installation.docx` | installation locale, configuration des services et déploiement Netlify |
| `4 - Documentation_API.docx` | routes HTTP, Server Actions, contrats, erreurs et effets de bord |
| `5 - Plan_de_securite.docx` | menaces, contrôles, confidentialité, incidents et RGPD |
| `6 - Plan_de_maintenance.docx` | CI/CD, exploitation, supervision, rollback et runbooks |
| `7 - Manuel_utilisateur.docx` | parcours public, espace client et BackOffice illustrés |
| `8 - Manques_et_limites.txt` | limites fonctionnelles et techniques connues |
| `9 - Plan_de_tests_CYNA.xlsx` | cas de test fonctionnels, techniques et de sécurité à exécuter |
| `10 - Structure_du_code.docx` | organisation actuelle du dépôt et responsabilités des principaux modules |

Tous les documents portent la référence du Groupe 1 et les noms Hugo FAURE, Samuel KAKEZ, Mathieu FRAUX et Florian BELLOC. Ils ne portent aucune mention de confidentialité.

## État documenté

Le développement et GitHub Actions utilisent Node.js 24 depuis `webapp-cyna/.nvmrc`. Le déploiement Netlify utilise Node.js 22 et `@netlify/plugin-nextjs`, conformément au `netlify.toml` racine et au `package.json` de l’application.

Les documents ont été contrôlés après génération : sommaires matérialisés, schémas intégrés, pages rendues visuellement et audits de structure et d’accessibilité exécutés. Aucun secret, DSN réel, jeton, identifiant client ni donnée personnelle n’est inclus dans les livrables.
