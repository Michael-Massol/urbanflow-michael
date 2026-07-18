import assert from "node:assert/strict";
import test from "node:test";
import { planJourney } from "../../src/modules/journey-planning/application/plan-journey.ts";
import { DemoTransportProvider } from "../../src/modules/transport/infrastructure/demo/demo-transport-provider.ts";
import type { JourneyPlace } from "../../src/modules/journey-planning/domain/models.ts";

const capitole: JourneyPlace = { id: "capitole", label: "Capitole", type: "point_of_interest", latitude: 43.6045, longitude: 1.4442, source: "demo" };
const matabiau: JourneyPlace = { id: "toulouse-matabiau", label: "Toulouse-Matabiau", type: "stop", latitude: 43.6114, longitude: 1.4537, source: "demo" };
const baseCriteria = { origin: matabiau, destination: capitole, departureAt: "2026-07-18T10:00:00.000Z", preferredModes: ["metro"], avoidedModes: [], maxWalkingMinutes: 30, reducedMobility: false };

test("PlanJourney returns normalized deterministic demo alternatives", async () => {
  const result = await planJourney(new DemoTransportProvider(), baseCriteria);
  assert.ok(result.journeys.length >= 2);
  assert.equal(result.isDemo, true);
  assert.equal(result.isRealTime, false);
  assert.match(result.notice ?? "", /démonstration/i);
  assert.ok(result.journeys.every((journey) => journey.provider === "demo" && journey.realtime === false));
});

test("PlanJourney rejects equal places, invalid coordinates and invalid dates", async () => {
  const provider = new DemoTransportProvider();
  await assert.rejects(planJourney(provider, { ...baseCriteria, destination: matabiau }), { name: "ZodError" });
  await assert.rejects(planJourney(provider, { ...baseCriteria, origin: { ...matabiau, latitude: 120 } }), { name: "ZodError" });
  await assert.rejects(planJourney(provider, { ...baseCriteria, departureAt: "tomorrow" }), { name: "ZodError" });
});

test("PlanJourney supports current location without persistence or network", async () => {
  const current: JourneyPlace = { id: "current-location", label: "Ma position actuelle", type: "current_location", latitude: 43.6, longitude: 1.43, source: "browser" };
  const result = await planJourney(new DemoTransportProvider(), { ...baseCriteria, origin: current });
  assert.equal(result.journeys.length, 3);
  assert.equal(result.journeys[0]?.segments[0]?.origin.type, "current_location");
});

test("PlanJourney applies maximum walking time", async () => {
  const result = await planJourney(new DemoTransportProvider(), { ...baseCriteria, maxWalkingMinutes: 5 });
  assert.ok(result.journeys.every((journey) => journey.walkingMinutes <= 5));
});
