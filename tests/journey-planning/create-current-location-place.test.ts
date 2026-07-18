import assert from "node:assert/strict";
import test from "node:test";
import { createCurrentLocationPlace } from "../../src/modules/journey-planning/application/create-current-location-place.ts";

test("browser coordinates become a normalized current-location place", () => {
  const place = createCurrentLocationPlace(43.6045, 1.4442);
  assert.equal(place.type, "current_location");
  assert.equal(place.source, "browser");
  assert.equal(place.label, "Ma position actuelle");
});

test("invalid browser coordinates are rejected", () => {
  assert.throws(() => createCurrentLocationPlace(100, 1.4442), { name: "ZodError" });
});
