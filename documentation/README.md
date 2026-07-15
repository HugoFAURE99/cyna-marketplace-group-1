# Documentation technique CYNA V2

Les six documents Word sont générés à partir des sources Markdown de `sources/` et des schémas Mermaid de `diagrammes/src/`. Les fichiers DOCX conservent leurs noms historiques pour remplacer directement la livraison précédente.

## Contenu

| Source | Document généré |
|---|---|
| `sources/01-sfd.md` | `1 - SFD_Specification_fonctionnelle.docx` |
| `sources/02-dat.md` | `2 - DAT_Architecture_technique.docx` |
| `sources/03-installation.md` | `3 - Guide_installation.docx` |
| `sources/04-api.md` | `4 - Documentation_API.docx` |
| `sources/05-securite.md` | `5 - Plan_de_securite.docx` |
| `sources/06-maintenance.md` | `6 - Plan_de_maintenance.docx` |

## Régénération

Prérequis : Python 3 avec `python-docx`, Pillow, lxml, PyMuPDF et pdfplumber ; LibreOffice ; Node.js ; `@mermaid-js/mermaid-cli@11.12.0`.

```powershell
npm install --prefix documentation/.tools --no-save @mermaid-js/mermaid-cli@11.12.0
./documentation/render_diagrams.ps1
./documentation/build_all.ps1
```

`render_diagrams.ps1` produit un SVG et un PNG haute résolution par source. `build_all.ps1` construit les DOCX, convertit une première fois en PDF pour matérialiser les numéros de page du sommaire, puis reconstruit les documents. Les fichiers `.toc/*.json` sont versionnés afin de stabiliser les sommaires sans mise à jour manuelle dans Word.

## Contrôle qualité attendu

Après toute modification : valider les sources Mermaid, exécuter les audits de structure et d’accessibilité, rendre chaque page en PNG, puis contrôler à 100 % les coupures, tableaux, sommaires, légendes et schémas. Aucun secret, DSN réel, jeton, identifiant client ni donnée personnelle ne doit apparaître dans les sources ou les documents générés.
