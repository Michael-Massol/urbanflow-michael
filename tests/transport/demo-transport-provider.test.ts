import assert from "node:assert/strict";
import test from "node:test";
import { DemoTransportProvider, DEMO_PROVIDER_NOTICE } from "../../src/modules/transport/infrastructure/demo/demo-transport-provider.ts";

const provider = new DemoTransportProvider();

test("demo provider is visibly identified as non-real-time", () => {
  assert.equal(provider.descriptor.isDemo, true);
  assert.equal(provider.descriptor.isRealTime, false);
  assert.equal(provider.descriptor.notice, "Données de démonstration — non temps réel");
  assert.equal(DEMO_PROVIDER_NOTICE, provider.descriptor.notice);
});

test("searchPlaces is accent-insensitive, deterministic, and limited", async () => {
  const first = await provider.searchPlaces({ query: "jean jaures", limit: 1 });
  const second = await provider.searchPlaces({ query: "jean jaures", limit: 1 });
  assert.deepEqual(first, second);
  assert.equal(first.length, 1);
  assert.equal(first[0]?.id, "jean-jaures");
});

for (const [originId, destinationId] of [
  ["toulouse-matabiau", "capitole"],
  ["capitole", "universite-paul-sabatier"],
  ["jean-jaures", "arenes"],
] as const) {
  test(`returns at least two normalized options for ${originId} to ${destinationId}`, async () => {
    const options = await provider.planJourney({ originId, destinationId });
    assert.ok(options.length >= 2);
    for (const option of options) {
      assert.equal(option.isRealTime, false);
      assert.ok(option.durationMinutes > 0);
      assert.ok(option.distanceMeters > 0);
      assert.ok(option.legs.length > 0);
      assert.equal(
        option.durationMinutes,
        option.legs.reduce((total, leg) => total + leg.durationMinutes, 0),
      );
      assert.equal(
        option.distanceMeters,
        option.legs.reduce((total, leg) => total + leg.distanceMeters, 0),
      );
    }
  });
}

test("rejects a route absent from the versioned scenarios", async () => {
  await assert.rejects(
    provider.planJourney({ originId: "arenes", destinationId: "capitole" }),
    { name: "JourneyNotSupportedError" },
  );
});
