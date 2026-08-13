import assert from "node:assert/strict";
import test from "node:test";
import { confirmCompletedJourney } from "../../src/modules/carbon-tracking/application/confirm-completed-journey.ts";
import { createStoredJourneyGeometry } from "../../src/modules/carbon-tracking/application/create-stored-journey-geometry.ts";
import { getCarbonSummary } from "../../src/modules/carbon-tracking/application/get-carbon-summary.ts";
import { completedJourneyInputSchema } from "../../src/modules/carbon-tracking/domain/completed-journey-schema.ts";
import type { CompletedJourney, CompletedJourneyRepository } from "../../src/modules/carbon-tracking/domain/models.ts";
import type { Journey } from "../../src/modules/journey-planning/domain/models.ts";

const place = { id: "a", label: "A", type: "stop" as const, latitude: 43.6, longitude: 1.4, source: "demo" };
const journey: Journey = { id: "j", departureAt: "2026-07-18T10:00:00.000Z", arrivalAt: "2026-07-18T10:10:00.000Z", durationMinutes: 10, walkingMinutes: 10, transferCount: 0, modes: ["walking"], provider: "demo", realtime: false, segments: [{ id: "s", mode: "walking", origin: place, destination: { ...place, label: "B" }, departureAt: "2026-07-18T10:00:00.000Z", arrivalAt: "2026-07-18T10:10:00.000Z", durationMinutes: 10, distanceMeters: 1000 }] };

test("only the explicit confirmation use case calls persistence", async () => {
  let calls = 0;
  const repository: CompletedJourneyRepository = {
    async create(value) { calls += 1; return { ...value, id: "saved", confirmedAt: "2026-07-18T11:00:00.000Z" }; },
    async listByUserId() { return []; },
    async deleteById() { return false; },
  };
  const saved = await confirmCompletedJourney(repository, "user-a", journey);
  assert.equal(calls, 1);
  assert.equal(saved.userId, "user-a");
  assert.equal(saved.emissionsGramsCo2e, 0);
  assert.equal(saved.geometry, null);
});

test("confirmation stores a validated normalized geometry snapshot", async () => {
  let storedGeometry = null;
  const repository: CompletedJourneyRepository = {
    async create(value) {
      storedGeometry = value.geometry;
      return { ...value, id: "saved", confirmedAt: "2026-07-18T11:00:00.000Z" };
    },
    async listByUserId() { return []; },
    async deleteById() { return false; },
  };
  const geometry = {
    type: "LineString" as const,
    coordinates: [[1.4, 43.6], [1.4, 43.6], [1.45, 43.61]] as [number, number][],
  };
  const withGeometry: Journey = {
    ...journey,
    geometry,
    segments: [{ ...journey.segments[0]!, geometry }],
  };

  await confirmCompletedJourney(repository, "user-a", withGeometry);

  assert.deepEqual(storedGeometry, {
    type: "LineString",
    coordinates: [[1.4, 43.6], [1.45, 43.61]],
  });
});

test("invalid or insufficient geometry is not persisted", () => {
  const invalidGeometryJourney = {
    ...journey,
    geometry: { type: "LineString" as const, coordinates: [[999, 43.6], [1.45, 43.61]] as [number, number][] },
  };
  assert.equal(createStoredJourneyGeometry(invalidGeometryJourney), null);
  assert.equal(createStoredJourneyGeometry(journey), null);
  assert.equal(completedJourneyInputSchema.safeParse(invalidGeometryJourney).success, false);
});

test("carbon summary aggregates only supplied confirmed journeys", () => {
  const completed: CompletedJourney = { id: "1", userId: "u", originLabel: "A", destinationLabel: "B", departureAt: journey.departureAt, arrivalAt: journey.arrivalAt, durationMinutes: 10, distanceMeters: 1000, modes: ["walking"], emissionsGramsCo2e: 2, carReferenceGramsCo2e: 142, avoidedGramsCo2e: 140, factorVersion: "v", provider: "demo", geometry: null, confirmedAt: journey.arrivalAt };
  assert.deepEqual(getCarbonSummary([completed, { ...completed, id: "2" }]), { journeyCount: 2, emissionsGramsCo2e: 4, carReferenceGramsCo2e: 284, avoidedGramsCo2e: 280 });
});
