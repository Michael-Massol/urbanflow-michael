import assert from "node:assert/strict";
import test from "node:test";
import { createDashboardViewModel } from "../../src/modules/dashboard/application/create-dashboard-view-model.ts";
import type { MobilityPreferences } from "../../src/modules/profile/domain/mobility-preferences.ts";

const configuredPreferences: MobilityPreferences = {
  userId: "b7a55d4a-8a35-4b49-8bd8-d6d947c72f68",
  preferredModes: ["metro"],
  avoidedModes: [],
  maxWalkingMinutes: 20,
  reducedMobility: false,
  updatedAt: "2026-07-18T00:00:00Z",
};

test("dashboard derives a configured profile from actual mobility data", () => {
  const dashboard = createDashboardViewModel({
    profile: { displayName: "  Camille  " },
    preferences: configuredPreferences,
    provider: "demo",
  });

  assert.equal(dashboard.greeting, "Bonjour Camille");
  assert.equal(dashboard.profileStatus, "complete");
  assert.equal(dashboard.profileStatusLabel, "Profil configuré");
  assert.match(dashboard.providerLabel, /Démonstration/);
  assert.deepEqual(dashboard.features.map(({ status }) => status), ["available", "available", "available"]);
  assert.equal(dashboard.features[2]?.href, "/planifier");
});

test("dashboard keeps a default preferences row incomplete", () => {
  const dashboard = createDashboardViewModel({
    profile: { displayName: "Camille" },
    preferences: { ...configuredPreferences, preferredModes: [] },
    provider: "tisseo",
  });

  assert.equal(dashboard.profileStatus, "incomplete");
  assert.equal(dashboard.profileStatusLabel, "Profil à compléter");
});

test("dashboard handles an absent profile and preferences", () => {
  const dashboard = createDashboardViewModel({
    profile: null,
    preferences: null,
    provider: "demo",
  });
  assert.equal(dashboard.greeting, "Bonjour");
  assert.equal(dashboard.profileStatus, "incomplete");
});
