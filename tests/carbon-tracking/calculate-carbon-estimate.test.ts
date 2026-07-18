import assert from "node:assert/strict";
import test from "node:test";
import { calculateCarbonEstimate } from "../../src/modules/carbon-tracking/domain/calculate-carbon-estimate.ts";
import { emissionFactors } from "../../src/modules/carbon-tracking/domain/emission-factors.ts";
import type { Journey } from "../../src/modules/journey-planning/domain/models.ts";

const place = { id: "capitole", label: "Capitole", type: "stop" as const, latitude: 43.6, longitude: 1.44, source: "demo" };
const journey: Journey = {
  id: "carbon-test", departureAt: "2026-07-18T10:00:00.000Z", arrivalAt: "2026-07-18T10:10:00.000Z",
  durationMinutes: 10, walkingMinutes: 2, transferCount: 0, modes: ["walking", "metro"], provider: "demo", realtime: false,
  segments: [
    { id: "walk", mode: "walking", origin: place, destination: place, departureAt: "2026-07-18T10:00:00.000Z", arrivalAt: "2026-07-18T10:02:00.000Z", durationMinutes: 2, distanceMeters: 200 },
    { id: "metro", mode: "metro", origin: place, destination: place, departureAt: "2026-07-18T10:02:00.000Z", arrivalAt: "2026-07-18T10:10:00.000Z", durationMinutes: 8, distanceMeters: 1800 },
  ],
};

test("carbon calculation sums segment distances and compares the same distance with a thermal car", () => {
  const result = calculateCarbonEstimate(journey);
  assert.equal(result.distanceMeters, 2000);
  assert.equal(result.gramsCo2e, 7.99);
  assert.equal(result.carReferenceGramsCo2e, 284);
  assert.equal(result.avoidedGramsCo2e, 276.01);
});

test("emission factors cover every V3 mode with explicit metadata", () => {
  for (const mode of ["walking", "bike", "metro", "tram", "bus", "train", "car_thermal_reference"] as const) {
    const factor = emissionFactors[mode];
    assert.equal(factor.unit, "gCO2e/passenger-km");
    assert.ok(factor.source.startsWith("https://impactco2.fr/"));
    assert.ok(factor.version);
    assert.match(factor.effectiveDate, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("carbon calculation rejects a segment without distance", () => {
  const invalid = { ...journey, segments: [{ ...journey.segments[0], distanceMeters: undefined }] } as unknown as Journey;
  assert.throws(() => calculateCarbonEstimate(invalid), /distance/);
});
