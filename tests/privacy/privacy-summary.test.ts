import assert from "node:assert/strict";
import test from "node:test";
import { getPrivacySummary } from "../../src/modules/privacy/application/get-privacy-summary.ts";
import type { PrivacyDataRepository } from "../../src/modules/privacy/domain/models.ts";

test("privacy summary reports stored categories without exposing their content", async () => {
  const repository: PrivacyDataRepository = {
    async getSnapshot(userId) {
      return {
        user: { id: userId, email: "private@example.test" },
        profile: {
          userId,
          displayName: "Personne",
          createdAt: "2026-07-18T00:00:00.000Z",
          updatedAt: "2026-07-18T00:00:00.000Z",
        },
        mobilityPreferences: null,
        completedJourneys: [],
      };
    },
  };

  assert.deepEqual(await getPrivacySummary(repository, "user-a"), {
    hasProfile: true,
    hasMobilityPreferences: false,
    completedJourneyCount: 0,
    storesPreciseLocations: false,
  });
});
