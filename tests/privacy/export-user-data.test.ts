import assert from "node:assert/strict";
import test from "node:test";
import { exportUserData } from "../../src/modules/privacy/application/export-user-data.ts";
import type {
  PrivacyDataRepository,
  PrivacyDataSnapshot,
} from "../../src/modules/privacy/domain/models.ts";

const snapshot: PrivacyDataSnapshot = {
  user: { id: "user-a", email: "personne@example.test" },
  profile: {
    userId: "user-a",
    displayName: "Camille",
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-02T10:00:00.000Z",
  },
  mobilityPreferences: {
    userId: "user-a",
    preferredModes: ["metro"],
    avoidedModes: [],
    maxWalkingMinutes: 15,
    reducedMobility: false,
    updatedAt: "2026-07-02T10:00:00.000Z",
  },
  completedJourneys: [{
    id: "journey-a",
    userId: "user-a",
    originLabel: "Capitole",
    destinationLabel: "Jean-Jaurès",
    departureAt: "2026-07-17T10:00:00.000Z",
    arrivalAt: "2026-07-17T10:10:00.000Z",
    durationMinutes: 10,
    distanceMeters: 1200,
    modes: ["metro"],
    emissionsGramsCo2e: 5.33,
    carReferenceGramsCo2e: 170.4,
    avoidedGramsCo2e: 165.07,
    factorVersion: "urbanflow-ademe-2025.1",
    provider: "demo",
    confirmedAt: "2026-07-17T10:15:00.000Z",
  }],
};

class StubPrivacyRepository implements PrivacyDataRepository {
  private readonly value: PrivacyDataSnapshot;

  constructor(value: PrivacyDataSnapshot) {
    this.value = value;
  }
  async getSnapshot(): Promise<PrivacyDataSnapshot> {
    return structuredClone(this.value);
  }
}

test("personal export is deterministic and contains only the owner's useful data", async () => {
  const result = await exportUserData(
    new StubPrivacyRepository(snapshot),
    "user-a",
    new Date("2026-07-18T00:00:00.000Z"),
  );

  assert.equal(result.exportVersion, "1.0");
  assert.equal(result.generatedAt, "2026-07-18T00:00:00.000Z");
  assert.equal(result.user.id, "user-a");
  assert.equal(result.user.profile?.displayName, "Camille");
  assert.equal(result.completedJourneys.length, 1);
  assert.equal(result.carbonSummary.journeyCount, 1);
  assert.equal(result.carbonSummary.avoidedGramsCo2e, 165.07);
});

test("personal export excludes tokens, passwords, precise coordinates and redundant owner fields", async () => {
  const result = await exportUserData(new StubPrivacyRepository(snapshot), "user-a");
  const serialized = JSON.stringify(result);

  for (const forbidden of ["password", "token", "secret", "latitude", "longitude", "rawTisseo"]) {
    assert.doesNotMatch(serialized.toLowerCase(), new RegExp(forbidden.toLowerCase()));
  }
  assert.equal("userId" in (result.user.profile ?? {}), false);
  assert.equal("userId" in (result.user.mobilityPreferences ?? {}), false);
  assert.equal("userId" in (result.completedJourneys[0] ?? {}), false);
});

test("personal export rejects a snapshot belonging to another user", async () => {
  await assert.rejects(
    exportUserData(new StubPrivacyRepository(snapshot), "user-b"),
    /non autorisé/,
  );
});
