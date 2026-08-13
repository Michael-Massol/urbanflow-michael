# Spike technique Tisséo

## Décision


L'API v2 est joignable en HTTPS et protège bien `places` et `journeys` par une clé transmise dans le paramètre `key`. Les appels sans clé ont réellement retourné `401`, `text/plain; charset=utf-8` et `No key provided`. Une clé synthétique invalide a retourné `403` avec un corps texte. Aucun des deux cas n'exposait d'en-tête de quota.

La clé personnelle a permis de valider en direct la recherche de lieux et le calcul d'un trajet toulousain : les deux appels ont répondu en JSON avec un statut `200`. Le résumé a détecté 14 géométries WKT sur le premier trajet sans conserver leurs coordonnées. Le GO reste limité car aucun en-tête de quota n'a été exposé et la validation visuelle MapLibre doit encore être réalisée dans un navigateur compatible. Le terme court `ca` a également répondu `200`, contrairement au refus annoncé dans la documentation consultée : l'adaptateur ne doit donc pas dépendre de cette erreur supposée.

## Sources et faits vérifiés

- Documentation développeur API v2, mise à jour du 21 mai 2025 : <https://data.toulouse-metropole.fr/explore/dataset/api-temps-reel-tisseo/api/>
- Point d'entrée : `https://api.tisseo.fr/v2`.
- API REST en lecture seule ; seules les requêtes GET sont documentées.
- Formats annoncés : JSON et XML, encodage UTF-8.
- Une clé personnelle est obligatoire à chaque appel sous la forme `key=<clé>`.
- La clé est demandée à `opendata@tisseo.fr` avec identité, courriel et usage prévu.
- La documentation indique une surveillance de l'utilisation par clé et par période, mais ne publie pas de seuil chiffré garanti.
- `places` refuse selon la documentation les termes de moins de trois caractères et exige `term` ou `coordinatesXY`.
- `journeys` accepte notamment `departurePlace`, `arrivalPlace`, `firstDepartureDatetime`, `roadMode`, `roadMaxDistance`, `maxTransferNumber`, `rollingStockList`, `number` et `displayWording`.

## Exécution

Pré-requis : Node.js 22 ou ultérieur.

```powershell
Copy-Item spikes/tisseo/.env.example spikes/tisseo/.env.local
# Renseigner TISSEO_API_KEY uniquement dans spikes/tisseo/.env.local.
npm run probe
```

Ces commandes s'exécutent depuis la racine du dépôt. `npm run probe` délègue au spike et charge automatiquement `spikes/tisseo/.env.local` lorsqu'il existe. Une variable `TISSEO_API_KEY` déjà définie dans le terminal reste prioritaire. Le script n'affiche jamais la clé. Il écrit `spikes/tisseo/artifacts/latest-probe.json`, répertoire ignoré par Git. Les réponses JSON réussies ne sont jamais copiées : seuls les noms de champs, longueurs de tableaux et types de géométrie sont conservés.

Pour le contrôle TypeScript, installer uniquement les dépendances du spike :

```powershell
npm install
npm run typecheck
npm test
```

Les tests d'exécution et d'anonymisation ne nécessitent pas de clé. `npm run probe` fonctionne aussi sans clé et documente alors uniquement les erreurs d'authentification.

## Scénarios automatisés

Toujours exécutés :

1. recherche `capitole` sans clé ;
2. recherche avec une fausse clé non sensible.

Ajoutés automatiquement lorsque `TISSEO_API_KEY` existe :

1. recherche `capitole`, maximum cinq résultats ;
2. comportement observé avec le terme court `ca` ;
3. recherche sans `term` ni coordonnées ;
4. trajet public Capitole vers Marengo-SNCF, maximum deux résultats ;
5. trajet sans destination.

Ces lieux publics et génériques ne correspondent à aucune localisation personnelle.

## Analyse attendue après exécution authentifiée

Le fichier anonymisé permet de vérifier :

- statuts et types MIME ;
- clés racines et cardinalités ;
- présence de suites de coordonnées ou de géométries encodées ;
- temps de réponse ;
- en-têtes contenant `rate`, `quota` ou `retry-after` ;
- différences entre succès, validation, authentification et indisponibilité réseau.

Les réponses réelles confirment `x=longitude`, `y=latitude` pour `places`, et les WKT utilisent l’ordre longitude/latitude avec le SRID 4326. Cette convention est couverte par les tests de l’adaptateur. La vérification visuelle MapLibre reste distincte et ne doit pas être revendiquée avant une capture manuelle réussie.

## Limites et étape de sortie du spike

Le statut pourra devenir **GO** sans limite liée au format lorsque :

- les dates, durées et unités sont identifiées ;
- les géométries sont visualisées correctement avec leur SRID et leur ordre d'axes ;
- les erreurs authentifiées sont reproductibles ;
- les quotas ou leur absence d'engagement sont acceptés pour la démonstration.

Si un de ces critères structurels échoue, conserver le contrat `TransportProvider` et évaluer un autre fournisseur. Ne pas adapter le domaine UrbanFlow au format Tisséo.

## Confidentialité

- `.env` et `artifacts/` sont ignorés.
- Aucun secret n'est présent dans les fixtures.
- Aucune réponse brute réussie n'est enregistrée.
- Les URL de rapport remplacent toute clé par `<redacted>`.
- Les fixtures versionnées contiennent uniquement les erreurs publiques observées et un résumé géométrique synthétique clairement identifié.
