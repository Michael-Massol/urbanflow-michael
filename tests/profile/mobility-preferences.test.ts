import assert from "node:assert/strict";
import test from "node:test";
import { mobilityPreferencesSchema } from "../../src/modules/profile/domain/mobility-preferences.ts";

test("mobility preferences accept valid modes and walking duration boundaries", () => {
  const preferences = mobilityPreferencesSchema.parse({
    preferredModes: ["metro", "bike"],
    avoidedModes: ["bus"],
    maxWalkingMinutes: 0,
    reducedMobility: true,
  });
  assert.deepEqual(preferences.preferredModes, ["metro", "bike"]);
  assert.equal(preferences.maxWalkingMinutes, 0);
});

test("mobility preferences reject unknown, conflicting and excessive values", () => {
  assert.throws(() => mobilityPreferencesSchema.parse({
    preferredModes: ["metro"],
    avoidedModes: ["metro"],
    maxWalkingMinutes: 121,
    reducedMobility: false,
  }), { name: "ZodError" });
  assert.throws(() => mobilityPreferencesSchema.parse({
    preferredModes: ["plane"],
    avoidedModes: [],
    maxWalkingMinutes: 20,
    reducedMobility: false,
  }), { name: "ZodError" });
});
