# Fixtures Tisséo

Ces fixtures proviennent des réponses authentifiées observées le 10 août 2026 pour des lieux publics
(`Capitole` et `Marengo-SNCF`). Elles ne contiennent aucune clé, URL authentifiée, adresse personnelle
ou donnée utilisateur. Les listes de résultats et les géométries WKT ont été réduites pour garder des
tests déterministes et lisibles, sans modifier la structure des DTO utilisée par l’adaptateur.

Elles ne constituent pas une preuve de temps réel : l’endpoint `journeys` observé ne fournit aucun
indicateur explicite permettant de qualifier les horaires retournés de temps réel.
