# Architecture

Vigie est l'interface d'un outil de prospection B2B, en JavaScript sans dépendance, livrée en un seul fichier HTML (`dist/vigie.html`, ≈ 147 Ko). Elle parle soit à un serveur, soit à un moteur de démonstration embarqué qui en reproduit les règles. Ce document décrit la chaîne de build, la couche d'accès aux données, le cycle de vie d'un lead et les garde-fous.

## De `src/` à `dist/`

```
src/*.html ───────┐
src/styles/*.css  ├─ scripts/build.mjs ──► dist/vigie.html
src/fonts/*.woff2 ┤     • <link rel="stylesheet"> → <style> (url() des polices → data:font/woff2)
src/js/*.js ──────┘     • <script src> d'un même data-bundle → un seul <script>
```

- Le gabarit référence les fichiers comme une page web classique ; les balises qui partagent un `data-bundle` sont concaténées dans l'ordre, sans séparateur. Le résultat est un script classique unique : les déclarations d'un module sont visibles de tous, comme dans un fichier d'un seul tenant.
- `npm run build -- --check` reconstruit en mémoire et compare octet par octet avec `dist/vigie.html` ; la CI échoue au moindre écart.
- `scripts/lib.mjs` porte aussi les contrôles : ressources externes (balises `src`/`href`, `url()`, `@import`, `import()`) et données personnelles (adresses, jetons, liens privés, termes locaux d'un fichier `.prive-termes.txt` jamais publié).

## Modules

| Fichier | Rôle |
|---|---|
| `data/graine-demo.js` | `window.VIGIE_SEED` : état, espaces de travail, leads, CRM, journal — tout fictif |
| `01-base.js` | état de l'interface, libellés des statuts et des adresses, file du jour (`queueAll`, `queue`), échappement |
| `02-messages.js` | textes d'erreur et d'aide |
| `03-acces-donnees.js` | `api(path, body)` : serveur (`fetch`) ou moteur embarqué, selon la présence de la graine |
| `04-en-tete.js` | navigation, compteurs, relance de la démonstration |
| `05-rendu.js` | fiche du jour : signal, score détaillé, contact, messages, avertissements |
| `06-gestes.js` | décisions : valider et envoyer, valider, réécrire, plus tard, observer, écarter avec motif |
| `07-leads.js` | liste filtrable de tous les leads |
| `08-suivi.js` | journal des décisions, rapport |
| `09-crm.js` | pipeline, sociétés, opportunités, tâches, chiffres |
| `10-reglages.js` | espace de travail : offre, cibles, signaux et poids, ton, seuils, sources ; liste d'opposition |
| `11-evenements.js` | délégation d'événements, raccourcis clavier, authentification côté serveur |
| `12-moteur-demo.js` | moteur embarqué : mêmes routes, mêmes règles, état en mémoire |
| `13-demarrage.js` | premier chargement, veille automatique si la dernière collecte date de plus de 12 h |

## Couche d'accès aux données

```
interface ── api("/api/…", corps) ──┬── serveur : fetch, JSON, en-tête X-Vigie sur les écritures
                                    └── démonstration : mock(path, body) sur une copie de VIGIE_SEED
```

Les réponses du moteur embarqué sont clonées (`JSON.parse(JSON.stringify(…))`) : l'interface ne peut jamais modifier l'état du moteur par référence, comme avec un vrai serveur. Une réponse 401 du serveur ramène à l'écran de connexion.

## Cycle de vie d'un lead

```
qualifié → enrichi → à valider ──┬── prêt à partir → envoyé → répondu
                                 ├── sous observation
                                 ├── écarté par vous (motif obligatoire)
                                 └── périmé (durée de vie du signal dépassée)
écarté par le moteur : la fiche reste consultable et peut être reprise à la main
```

- **Score** = adéquation (40) + besoin (60) ; le détail de chaque point est affiché sur la fiche. Les tiers A, B… découlent des seuils de l'espace de travail.
- **Durée de vie** : chaque type de signal a sa péremption (`shelf_days`, de 21 à 90 jours selon les quinze types de signaux de la démonstration) ; la file du jour fait passer en premier ce qui périme dans les sept jours.

## Garde-fous

| Règle | Où |
|---|---|
| Tout nombre du brouillon absent de la source, de l'offre et de la signature est signalé | `mWarn` (moteur), affichage dans `05-rendu.js` |
| Tout champ entre crochets (`[PRÉNOM]`…) est signalé | expression `PH` |
| Aucune validation sans nom d'utilisateur : chaque décision est nominative | `mActor` |
| Liste d'opposition et délai de carence entre deux contacts d'une même société (120 jours dans la démonstration) | réglages `suppression`, `cooldown_days` |
| Chaque décision est journalisée (qui, quand, quoi, motif) | `mEv`, onglet Suivi |

## Tests

| Fichier | Vérifie |
|---|---|
| `tests/build.test.mjs` | `dist/` à jour, document complet (langue, encodage, viewport, titre, description), aucune ressource externe, aucun fichier orphelin dans `src/`, aucune donnée personnelle |
| `tests/e2e/app.spec.mjs` | ouverture hors ligne sans erreur ni requête, absence de débordement horizontal, parcours des cinq sections, des trois canaux, report et validation d'une fiche, relance de la démonstration ; en 1440 × 900 et en 390 × 844 tactile |

Les parcours sont décrits dans `build.config.json` (`e2e.flows`), ce qui garde le fichier de test générique.
