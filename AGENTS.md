# AGENTS.md — UrbanFlow Mobility

## Objectif

UrbanFlow Mobility est une PWA permettant à un citoyen de créer un profil de mobilité, rechercher des itinéraires multimodaux, consulter des données de transport et comparer l’impact carbone des trajets.

Le projet est réalisé individuellement dans le cadre du titre RNCP 36146 — Concepteur Développeur de Solutions Digitales.

## Périmètre MVP

Fonctionnalités obligatoires :

1. inscription et connexion ;
2. gestion du profil et des préférences de mobilité ;
3. géolocalisation avec consentement ;
4. recherche d’un itinéraire multimodal ;
5. intégration d’au moins une source de données de transport ;
6. affichage de plusieurs propositions de trajet ;
7. calcul de l’empreinte carbone ;
8. installation en tant que PWA.

Hors périmètre initial :

- paiement réel ;
- réservation réelle auprès d’opérateurs ;
- intelligence artificielle prédictive complexe ;
- gestion complète d’une métropole en production ;
- microservices distribués ;
- infrastructure haute disponibilité.

## Stack technique

À compléter après décision :

- Frontend :
- Backend :
- Base de données :
- Authentification :
- Cartographie :
- Données de transport :
- Tests :
- Hébergement :

Ne change pas la stack sans proposer et justifier la modification.

## Architecture

Respecter une séparation claire entre :

- interface utilisateur ;
- logique métier ;
- accès aux données ;
- intégrations externes ;
- authentification ;
- calcul carbone.

Toute API externe doit être isolée derrière un adaptateur ou un service.

## Commandes obligatoires

Avant de considérer une tâche comme terminée, exécuter les commandes disponibles parmi :

```bash
npm run lint
npm run typecheck
npm test
npm run build