import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("history presents V3 details and an owner deletion action", async () => {
  const page = await readFile("src/app/historique/page.tsx", "utf8");
  for (const label of [
    "Modes utilisés",
    "Voiture thermique de référence",
    "Version des facteurs",
    "DeleteCompletedJourneyForm",
  ]) assert.match(page, new RegExp(label));
});

test("journey confirmation discloses persisted and excluded data before the network call", async () => {
  const component = await readFile(
    "src/modules/journey-planning/presentation/journey-results.tsx",
    "utf8",
  );
  assert.match(component, /Avant d’enregistrer ce trajet/);
  assert.match(component, /coordonnées précises/);
  assert.match(component, /Oui, confirmer et enregistrer/);
  assert.match(component, /setPendingConfirmationId/);
});
