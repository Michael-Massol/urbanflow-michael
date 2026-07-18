import assert from "node:assert/strict";
import test from "node:test";
import { isMobilityProfileComplete } from "../../src/modules/profile/domain/mobility-profile-completeness.ts";
import type { MobilityMode, MobilityPreferences } from "../../src/modules/profile/domain/mobility-preferences.ts";

function preferences(
  preferredModes: MobilityMode[],
  maxWalkingMinutes: number,
): Pick<MobilityPreferences, "preferredModes" | "maxWalkingMinutes"> {
  return { preferredModes, maxWalkingMinutes };
}

test("profile and preferences absent are incomplete", () => {
  assert.equal(isMobilityProfileComplete(null), false);
});

test("automatically created default preferences are incomplete", () => {
  assert.equal(isMobilityProfileComplete({
    displayName: "Camille",
    preferences: preferences([], 20),
  }), false);
});

test("display name alone is incomplete", () => {
  assert.equal(isMobilityProfileComplete({ displayName: "Camille", preferences: null }), false);
});

test("preferred mode alone is incomplete", () => {
  assert.equal(isMobilityProfileComplete({
    displayName: null,
    preferences: preferences(["metro"], 20),
  }), false);
});

test("name and preferred mode with invalid duration are incomplete", () => {
  assert.equal(isMobilityProfileComplete({
    displayName: "Camille",
    preferences: preferences(["metro"], Number.NaN),
  }), false);
});

test("name and preferred mode with zero duration are incomplete", () => {
  assert.equal(isMobilityProfileComplete({
    displayName: "Camille",
    preferences: preferences(["metro"], 0),
  }), false);
});

test("name, preferred mode and positive duration are complete", () => {
  assert.equal(isMobilityProfileComplete({
    displayName: "Camille",
    preferences: preferences(["metro"], 20),
  }), true);
});

test("whitespace-only display name is incomplete", () => {
  assert.equal(isMobilityProfileComplete({
    displayName: "   ",
    preferences: preferences(["metro"], 20),
  }), false);
});

test("several valid preferred modes produce a complete profile", () => {
  assert.equal(isMobilityProfileComplete({
    displayName: "Camille",
    preferences: preferences(["walking", "bike", "tram"], 15),
  }), true);
});
