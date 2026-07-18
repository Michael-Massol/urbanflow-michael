# UrbanFlow Mobility

UrbanFlow est un monolithe modulaire Next.js App Router.

## Stack du MVP

- Next.js 16, React 19 et TypeScript strict ;
- Supabase Auth et PostgreSQL avec Row Level Security ;
- CSS mobile-first sans bibliothèque UI ;
- MapLibre GL JS pour la carte optionnelle ;
- manifest App Router et service worker minimal ;
- ESLint, tests Node et build Next.js.

Les modules sont séparés en `domain`, `application`, `infrastructure` et `presentation`. Les Route Handlers et Server Actions ne portent pas les règles métier.

## Installation

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Renseigner dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL` ;
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ;
- `NEXT_PUBLIC_SITE_URL` ;
- `SUPABASE_SECRET_KEY` côté serveur pour le test RLS et la suppression complète du compte.

Appliquer ensuite, dans l'ordre, les migrations du dossier `supabase/migrations`. Elles créent le profil minimal, les préférences de mobilité, leurs déclencheurs d'initialisation et les politiques RLS par propriétaire.

Dans le modèle d'e-mail Supabase « Confirm signup », utiliser :

```text
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
```

La clé privilégiée ne doit jamais être exposée au navigateur. Les clients Supabase navigateur, serveur avec session et administratif sont séparés dans `src/modules/supabase/infrastructure`.

Renseigner aussi `NEXT_PUBLIC_PRIVACY_CONTACT_EMAIL` avant une publication publique. Les étapes complètes de reprise et de mise en production sont détaillées dans [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

## PWA

- `app/manifest.ts` décrit l'installation et les icônes 192/512 ;
- `public/sw.js` précharge uniquement la page hors ligne et les icônes ;
- les navigations utilisent le réseau puis `/hors-ligne` en secours ;
- aucune session, réponse Supabase ou donnée utilisateur n'est mise en cache ;
- une mise à jour attend l'accord de l'utilisateur avant d'activer le nouveau worker.

## Profil de mobilité et pages privées

Le profil permet de modifier le nom affiché, les modes préférés ou évités, la durée maximale de marche et la prise en compte d'une mobilité réduite. Les pages `/profil`, `/dashboard` et `/diagnostics/transport` vérifient la session côté serveur et redirigent vers `/connexion` sans utilisateur authentifié.

Le diagnostic transport expose uniquement le fournisseur, sa notice, la disponibilité booléenne du GTFS local et son statut. Il ne retourne jamais de clé API, de jeton ni de chemin local.

## Fournisseurs de transport

Le domaine dépend uniquement de `TransportProvider` :

```ts
provider.searchPlaces(request)
provider.planJourney(request)
```

Les résultats utilisent les modèles UrbanFlow `Place`, `JourneyRequest`, `JourneyOption`, `JourneyLeg` et `TransportMode`. Les DTO Tisséo, GTFS et fixtures restent dans `infrastructure/`.

### Mode démonstration

Configuration par défaut :

```env
TRANSPORT_PROVIDER=demo
TISSEO_API_KEY=
TISSEO_GTFS_PATH=
```

`DemoTransportProvider` fonctionne hors ligne et propose des itinéraires déterministes. Les trois parcours historiques conservent leurs fixtures versionnées :

- Toulouse-Matabiau → Capitole ;
- Capitole → Université Paul-Sabatier ;
- Jean-Jaurès → Arènes.

L’interface `/planifier` rend `provider.descriptor.notice` de manière visible. En mode démonstration, sa valeur est obligatoirement :

> Données de démonstration — non temps réel

Le mode `tisseo` exige une clé et un `TisseoTransportAdapter` explicitement injecté. Tant que l'adaptateur réel n'est pas validé, la sélection échoue clairement au lieu de retourner de fausses données.

## Planification V2

La route publique `/planifier` permet de rechercher un départ et une arrivée, choisir une date et une heure, utiliser une position après consentement explicite, comparer les propositions et consulter leurs segments. Les recherches, coordonnées et résultats ne sont ni enregistrés dans Supabase ni mis en cache par le service worker.

Les Route Handlers `/api/transport/places` et `/api/transport/journeys` valident les entrées, utilisent le fournisseur configuré côté serveur et répondent avec `Cache-Control: no-store`. Si une session existe, les préférences de mobilité du profil remplacent les valeurs publiques par défaut.

La carte est optionnelle. Pour l’activer, renseigner une URL publique de style MapLibre :

```env
NEXT_PUBLIC_MAP_STYLE_URL=https://example.org/style.json
```

Sans cette variable, le détail textuel reste entièrement disponible et un message explique que la carte est désactivée. Les itinéraires de démonstration sont fictifs, non temps réel et impropres à un déplacement réel. La recherche V2 ne persiste rien ; seuls la confirmation explicite et le module carbone V3 alimentent l’historique.

## Suivi carbone V3

Chaque proposition affiche une estimation calculée segment par segment en gCO₂e par passager-kilomètre et la compare à une voiture thermique moyenne diesel conduite seul. Rien n’est enregistré pendant la recherche : une première action présente précisément les données conservées et exclues, puis seule la seconde confirmation explicite crée une ligne dans `completed_journeys`. `/historique` et le résumé du dashboard sont privés et protégés par la RLS propriétaire. L’historique expose les modes, la référence voiture, la version des facteurs et permet au propriétaire de supprimer définitivement un trajet ; un trajet confirmé reste non modifiable.

Le référentiel statique `urbanflow-ademe-2025.1` reprend les valeurs publiées par ADEME/Impact CO₂ : marche 0, vélo mécanique 0,17, métro 4,44, tramway 4,28, bus thermique 122, TER 27,7 et voiture thermique moyenne diesel 142 gCO₂e/passager-km. Les liens sources et hypothèses sont conservés dans `src/modules/carbon-tracking/domain/emission-factors.ts`.

Ces valeurs sont des moyennes nationales. Le TER sert de référence prudente au mode générique `train`. La marche est comptée à zéro dans le périmètre retenu ; le vélo inclut la fabrication amortie publiée par Impact CO₂. L’estimation dépend des distances théoriques et ne constitue ni une mesure réelle ni un bilan de cycle de vie personnalisé. Les facteurs ne sont pas téléchargés dynamiquement en V3.

## Confidentialité et finalisation V4

La page privée `/confidentialite` fournit un résumé des catégories enregistrées, un export JSON versionné et la suppression complète du compte après double confirmation. L’export est construit depuis un modèle UrbanFlow explicite sous la session et la RLS ; il ne contient ni mot de passe, jeton, secret, coordonnées précises ou réponse brute fournisseur. Seule la suppression de l’utilisateur Auth emploie le client Supabase administratif `server-only`. Les cascades SQL effacent profil, préférences et trajets confirmés.

La politique publique est disponible sur `/politique-de-confidentialite`. Les pages d’erreur ne rendent aucun détail d’infrastructure. Les en-têtes CSP, HSTS en production, anti-framing, `nosniff`, politique de référent et Permissions Policy sont centralisés dans `next.config.ts`.

Documentation finale :

- [déploiement et reprise locale](docs/DEPLOIEMENT.md) ;
- [revue RGPD, sécurité, accessibilité et éco-conception](docs/RGPD-SECURITE-ACCESSIBILITE.md) ;
- [scénario et preuves de soutenance](docs/SOUTENANCE.md) ;
- [checklist V4 et traçabilité C1.1 à C3.3](docs/CHECKLIST-V4.md).

## GTFS Tisséo en lecture seule

`TisseoGtfsService` charge un dossier GTFS extrait contenant au minimum :

- `stops.txt` ;
- `routes.txt` ;
- `trips.txt` ;
- `stop_times.txt`.

Il peut rechercher un arrêt, trouver les arrêts proches et identifier les lignes desservant un arrêt. Il ne calcule aucun itinéraire.

Téléchargement dans le cache ignoré par Git :

```bash
npm run gtfs:download
```

Le script télécharge le fichier officiel dans `.cache/gtfs`, l'extrait avec `tar`, puis supprime l'archive. Le chemin par défaut à utiliser ensuite est `.cache/gtfs/tisseo`. Il peut être remplacé avec `TISSEO_GTFS_URL` ou `TISSEO_GTFS_CACHE`.

Le jeu officiel est publié quotidiennement et décrit environ trois semaines d'offre théorique : <https://transport.data.gouv.fr/datasets/tisseo-reseau-transport-urbain-toulousain>.

## Validation

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run test:rls
npm run test:spike
npm run build
```

### Preuve d'isolation RLS

`npm run test:rls` exécute un test d'intégration contre le projet Supabase configuré dans `.env.local`. Il crée deux utilisateurs techniques temporaires, vérifie l'isolation de leurs profils et préférences de mobilité, contrôle qu'une modification croisée n'a aucun effet et qu'une modification propriétaire fonctionne. Les deux comptes sont supprimés à la fin du test, y compris après un échec intermédiaire.

Ce test nécessite `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` et la migration des profils déjà appliquée. La clé privilégiée reste exclusivement côté serveur et ne doit jamais être commitée. Un test non exécuté faute de configuration ne constitue pas une validation RLS.

Le sous-ensemble GTFS sous `tests/fixtures/gtfs` est synthétique, petit et versionnable. Le GTFS complet reste dans `.cache/`.

## Sécurité et confidentialité

- Aucun secret ne doit être versionné.
- Les fichiers `.env*` sont ignorés sauf `.env.example`.
- La configuration transport est réservée au serveur et validée avec Zod.
- Les données de démonstration décrivent uniquement des lieux publics.
- Les recherches utilisateur ne sont pas persistées.
