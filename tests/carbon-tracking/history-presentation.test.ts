import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("history presents V3 details and an owner deletion action", async () => {
  const [page, list] = await Promise.all([
    readFile("src/app/historique/page.tsx", "utf8"),
    readFile("src/modules/carbon-tracking/presentation/completed-journey-history-list.tsx", "utf8"),
  ]);
  for (const label of [
    "Modes utilisés",
    "Émissions estimées du trajet",
    "Même trajet en voiture thermique",
    "Économie estimée",
    "Facteurs d’émission",
    "DeleteCompletedJourneyForm",
  ]) assert.match(list, new RegExp(label));
  assert.match(page, /CompletedJourneyHistoryList/);
});

test("history keeps text and a responsive map zone with explicit fallbacks", async () => {
  const [list, styles] = await Promise.all([
    readFile("src/modules/carbon-tracking/presentation/completed-journey-history-list.tsx", "utf8"),
    readFile("src/app/globals.css", "utf8"),
  ]);

  assert.match(list, /JourneyGeometryMap/);
  assert.match(list, /Carte indisponible pour ce trajet/);
  assert.match(list, /Carte désactivée : aucun style cartographique n’est configuré/);
  assert.match(list, /Carte du trajet \$\{journey\.originLabel\} vers \$\{journey\.destinationLabel\}/);
  assert.match(list, /activeMapId === journey\.id/);
  assert.match(styles, /\.history-card-layout\s*\{[^}]*display:\s*grid/);
  assert.match(styles, /@media \(min-width: 60rem\)[\s\S]*grid-template-columns:\s*minmax\(0, 55fr\) minmax\(20rem, 45fr\)/);
});

test("carbon savings are presented as a readable percentage", async () => {
  const { formatCarbonSavingsPercentage } = await import(
    "../../src/modules/carbon-tracking/presentation/format-carbon-savings.ts"
  );

  assert.equal(formatCarbonSavingsPercentage(112.66, 680.32), "−16,6 %");
  assert.equal(formatCarbonSavingsPercentage(0, 680.32), "0 %");
  assert.equal(formatCarbonSavingsPercentage(0, 0), null);
});

test("technical emission factor identifiers are formatted for users", async () => {
  const [{ formatEmissionFactorVersion }, historyPage, journeyResults] = await Promise.all([
    import("../../src/modules/carbon-tracking/presentation/format-emission-factor-version.ts"),
    readFile("src/app/historique/page.tsx", "utf8"),
    readFile("src/modules/journey-planning/presentation/journey-results.tsx", "utf8"),
  ]);

  assert.equal(formatEmissionFactorVersion("urbanflow-ademe-2025.1"), "ADEME — version 2025.1");
  assert.match(historyPage, /CompletedJourneyHistoryList/);
  assert.match(journeyResults, /formatEmissionFactorVersion\(props\.selected\.carbonEstimate\.factorVersion\)/);
});

test("journey confirmation discloses persisted and excluded data before the network call", async () => {
  const component = await readFile(
    "src/modules/journey-planning/presentation/journey-results.tsx",
    "utf8",
  );
  assert.match(component, /Avant d’enregistrer ce trajet/);
  assert.match(component, /tracé cartographique normalisé/);
  assert.match(component, /position précise du navigateur/);
  assert.match(component, /Oui, confirmer et enregistrer/);
  assert.match(component, /setPendingConfirmationId/);
});
