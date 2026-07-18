import assert from "node:assert/strict";
import test from "node:test";
import { sortJourneys } from "../../src/modules/journey-planning/application/sort-journeys.ts";
import type { Journey } from "../../src/modules/journey-planning/domain/models.ts";

function journey(id: string, durationMinutes: number, walkingMinutes: number, transferCount: number): Journey {
  return { id, departureAt: "2026-07-18T10:00:00Z", arrivalAt: "2026-07-18T11:00:00Z", durationMinutes, walkingMinutes, transferCount, modes: ["metro"], segments: [], provider: "demo", realtime: false };
}
const values = [journey("b", 20, 8, 0), journey("a", 20, 3, 1), journey("c", 25, 1, 0)];

test("journey sorts are deterministic for every supported criterion", () => {
  assert.deepEqual(sortJourneys(values, "fastest").map(({ id }) => id), ["a", "b", "c"]);
  assert.deepEqual(sortJourneys(values, "least-walking").map(({ id }) => id), ["c", "a", "b"]);
  assert.deepEqual(sortJourneys(values, "fewest-transfers").map(({ id }) => id), ["b", "c", "a"]);
  assert.deepEqual(sortJourneys(values, "recommended").map(({ id }) => id), sortJourneys(values, "recommended").map(({ id }) => id));
});
