import assert from "node:assert/strict";
import test from "node:test";
import { updateCompleteProfile } from "../../src/modules/profile/application/update-complete-profile.ts";
import type { MobilityPreferences, MobilityPreferencesRepository } from "../../src/modules/profile/domain/mobility-preferences.ts";
import type { Profile, ProfileRepository } from "../../src/modules/profile/domain/profile.ts";

const userId = "b7a55d4a-8a35-4b49-8bd8-d6d947c72f68";

class FakeProfileRepository implements ProfileRepository {
  async findByUserId(): Promise<Profile | null> { return null; }
  async updateDisplayName(id: string, displayName: string): Promise<Profile> {
    return { userId: id, displayName, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
  }
}

class FakePreferencesRepository implements MobilityPreferencesRepository {
  async findByUserId(): Promise<MobilityPreferences | null> { return null; }
  async update(id: string, preferences: Omit<MobilityPreferences, "userId" | "updatedAt">): Promise<MobilityPreferences> {
    return { userId: id, ...preferences, updatedAt: "2026-01-01" };
  }
}

test("complete profile update persists identity and mobility preferences", async () => {
  const result = await updateCompleteProfile(new FakeProfileRepository(), new FakePreferencesRepository(), {
    userId,
    displayName: "  Camille  ",
    preferences: { preferredModes: ["metro"], avoidedModes: ["bike"], maxWalkingMinutes: 15, reducedMobility: false },
  });
  assert.equal(result.profile.displayName, "Camille");
  assert.deepEqual(result.preferences.preferredModes, ["metro"]);
  assert.equal(result.preferences.maxWalkingMinutes, 15);
});
