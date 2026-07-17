# UrbanFlow Mobility

UrbanFlow est préparé comme un monolithe modulaire. L'application Next.js n'est pas encore générée ; le dépôt contient actuellement le noyau transport indépendant du framework et le spike Tisséo.

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

`DemoTransportProvider` fonctionne hors ligne et propose deux itinéraires déterministes pour chacun de ces parcours :

- Toulouse-Matabiau → Capitole ;
- Capitole → Université Paul-Sabatier ;
- Jean-Jaurès → Arènes.

La future interface doit rendre `provider.descriptor.notice` de manière visible. En mode démonstration, sa valeur est obligatoirement :

> Données de démonstration — non temps réel

Le mode `tisseo` exige une clé et un `TisseoTransportAdapter` explicitement injecté. Tant que l'adaptateur réel n'est pas validé, la sélection échoue clairement au lieu de retourner de fausses données.

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
npm install
npm run typecheck
npm test
npm run test:spike
```

Le sous-ensemble GTFS sous `tests/fixtures/gtfs` est synthétique, petit et versionnable. Le GTFS complet reste dans `.cache/`.

## Sécurité et confidentialité

- Aucun secret ne doit être versionné.
- Les fichiers `.env*` sont ignorés sauf `.env.example`.
- La configuration transport est réservée au serveur et validée avec Zod.
- Les données de démonstration décrivent uniquement des lieux publics.
- Les recherches utilisateur ne sont pas persistées.
