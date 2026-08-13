import assert from "node:assert/strict";
import test from "node:test";
import { TransportProviderError } from "../../src/modules/transport/domain/errors.ts";
import type { JourneyRequest, Place } from "../../src/modules/transport/domain/models.ts";
import { selectTransportProvider } from "../../src/modules/transport/infrastructure/config/select-transport-provider.ts";
import { parseTransportConfig } from "../../src/modules/transport/infrastructure/config/transport-config.ts";
import { geometryDistanceMeters, parseWktLineGeometry } from "../../src/modules/transport/infrastructure/tisseo/parse-wkt-geometry.ts";
import { TisseoTransportAdapter } from "../../src/modules/transport/infrastructure/tisseo/tisseo-transport-adapter.ts";
import { planJourney } from "../../src/modules/journey-planning/application/plan-journey.ts";
import { searchPlaces } from "../../src/modules/journey-planning/application/search-places.ts";
import journeysFixture from "../fixtures/tisseo/journeys-response.json" with { type: "json" };
import placesFixture from "../fixtures/tisseo/places-response.json" with { type: "json" };

const origin: Place = {
  id: "stop_area:SA_1715",
  name: "Capitole (Toulouse)",
  kind: "stop",
  coordinates: { longitude: 1.445537, latitude: 43.604465 },
};
const destination: Place = {
  id: "stop_area:SA_1357",
  name: "Marengo-SNCF (Toulouse)",
  kind: "stop",
  coordinates: { longitude: 1.45554, latitude: 43.61037 },
};
const journeyRequest: JourneyRequest = {
  originId: origin.id,
  destinationId: destination.id,
  origin,
  destination,
  departureAt: new Date("2026-08-10T15:24:00.000Z"),
  allowedModes: ["walk", "bus", "metro", "tram", "train"],
  maxWalkingMinutes: 20,
};

function fixtureFetcher(calls: URL[]) {
  return async (input: URL | RequestInfo) => {
    const url = new URL(String(input));
    calls.push(url);
    const fixture = url.pathname.endsWith("places.json") ? placesFixture : journeysFixture;
    return new Response(JSON.stringify(fixture), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
}

test("Tisséo search normalizes real place identifiers, types and coordinates", async () => {
  const calls: URL[] = [];
  const adapter = new TisseoTransportAdapter({ apiKey: "test-key", fetcher: fixtureFetcher(calls) });
  const places = await adapter.searchPlaces({ query: "Capitole", limit: 2 });

  assert.deepEqual(places[0], origin);
  assert.equal(places[1]?.kind, "public-place");
  assert.equal(places[1]?.coordinates.longitude, 1.442736);
  assert.equal(calls[0]?.searchParams.get("term"), "Capitole");
  assert.equal(calls[0]?.searchParams.get("key"), "test-key");
  assert.equal(adapter.descriptor.id, "tisseo");
  assert.equal(adapter.descriptor.isDemo, false);
});

test("Tisséo journey normalizes schedules, modes, segments and WKT geometry", async () => {
  const calls: URL[] = [];
  const adapter = new TisseoTransportAdapter({ apiKey: "test-key", fetcher: fixtureFetcher(calls) });
  const journeys = await adapter.planJourney(journeyRequest);
  const journey = journeys[0];

  assert.ok(journey);
  assert.equal(journey.departureAt?.toISOString(), "2026-08-10T15:24:35.000Z");
  assert.equal(journey.arrivalAt?.toISOString(), "2026-08-10T15:28:26.000Z");
  assert.equal(journey.durationMinutes, 4);
  assert.deepEqual(journey.legs.map((leg) => leg.mode), ["walk", "metro", "walk"]);
  assert.equal(journey.legs[1]?.lineName, "A");
  assert.equal(journey.legs[1]?.direction, "Balma-Gramont BALMA");
  assert.deepEqual(journey.legs[0]?.from.coordinates, { longitude: 1.445537, latitude: 43.604465 });
  assert.deepEqual(journey.legs[0]?.to.coordinates, { longitude: 1.445364, latitude: 43.60437 });
  assert.deepEqual(journey.legs[2]?.from.coordinates, { longitude: 1.455615, latitude: 43.610088 });
  assert.deepEqual(journey.legs[2]?.to.coordinates, { longitude: 1.455558, latitude: 43.610333 });
  assert.notEqual(journey.legs[2]?.from.name, origin.name);
  assert.equal(journey.legs.every((leg) => Boolean(leg.geometry)), true);
  assert.ok(journey.distanceMeters > 0);
  assert.equal(journey.transfers, 0);
  assert.equal(journey.isRealTime, false);
  assert.equal(calls[0]?.searchParams.get("departurePlaceXY"), "1.445537,43.604465");
  assert.equal(calls[0]?.searchParams.get("rollingStockList"), "commercial_mode:3,commercial_mode:10,commercial_mode:1,commercial_mode:2,commercial_mode:5");
  assert.equal(calls[0]?.searchParams.get("key"), "test-key");
});

test("SearchPlaces and PlanJourney expose only normalized Tisséo application models", async () => {
  const adapter = new TisseoTransportAdapter({ apiKey: "test-key", fetcher: fixtureFetcher([]) });
  const places = await searchPlaces(adapter, { query: "Capitole", limit: 1 });
  const result = await planJourney(adapter, {
    origin: places[0],
    destination: {
      id: destination.id,
      label: destination.name,
      type: "stop",
      latitude: destination.coordinates.latitude,
      longitude: destination.coordinates.longitude,
      source: "tisseo",
    },
    departureAt: "2026-08-10T15:24:00.000Z",
    preferredModes: [],
    avoidedModes: [],
    maxWalkingMinutes: 20,
    reducedMobility: false,
  });

  assert.equal(places[0]?.source, "tisseo");
  assert.equal(result.isDemo, false);
  assert.equal(result.isRealTime, false);
  assert.equal(result.journeys[0]?.provider, "tisseo");
  assert.equal(result.journeys[0]?.realtime, false);
  assert.match(result.notice ?? "", /Tisséo/);
  assert.doesNotMatch(JSON.stringify(result), /placesList|routePlannerResult|className|wkt/);
});

test("Tisséo realtime metadata is true only when every explicit flag confirms it", async () => {
  type MutableRealtimeFixture = {
    routePlannerResult: {
      journeys: Array<{
        journey: {
          realTime?: string;
          chunks: Array<{ service?: { realTime?: string } }>;
        };
      }>;
    };
  };
  const fixture = structuredClone(journeysFixture) as unknown as MutableRealtimeFixture;
  const fixtureJourney = fixture.routePlannerResult.journeys[0]?.journey;
  assert.ok(fixtureJourney);
  fixtureJourney.realTime = "1";
  const service = fixtureJourney.chunks.find((chunk) => chunk.service)?.service;
  assert.ok(service);
  service.realTime = "1";

  const adapter = new TisseoTransportAdapter({
    apiKey: "test-key",
    fetcher: async () => new Response(JSON.stringify(fixture), { status: 200 }),
  });
  assert.equal((await adapter.planJourney(journeyRequest))[0]?.isRealTime, true);

  service.realTime = "0";
  assert.equal((await adapter.planJourney(journeyRequest))[0]?.isRealTime, false);
});

test("WKT parsing supports real LINESTRING and MULTILINESTRING shapes", () => {
  const geometry = parseWktLineGeometry("MULTILINESTRING ((1.44 43.60, 1.45 43.61), (1.45 43.61, 1.46 43.62))");
  assert.deepEqual(geometry?.coordinates, [[1.44, 43.6], [1.45, 43.61], [1.46, 43.62]]);
  assert.ok(geometry && geometryDistanceMeters(geometry) > 0);
  assert.equal(parseWktLineGeometry("POINT (1.44 43.60)"), undefined);
});

test("Tisséo failures are explicit and never fall back to demo data", async () => {
  const adapter = selectTransportProvider(
    parseTransportConfig({ TRANSPORT_PROVIDER: "tisseo", TISSEO_API_KEY: "test-key" }),
    {
      tisseo: new TisseoTransportAdapter({
        apiKey: "test-key",
        fetcher: async () => new Response("Forbidden", { status: 403 }),
      }),
    },
  );

  assert.equal(adapter.descriptor.id, "tisseo");
  await assert.rejects(
    () => adapter.searchPlaces({ query: "Capitole" }),
    (error) => error instanceof TransportProviderError
      && error.code === "authentication"
      && error.status === 403,
  );
});

test("Tisséo maps rate limits, server failures, timeouts and invalid JSON", async () => {
  const cases = [
    { response: () => new Response("limit", { status: 429 }), code: "rate-limit" },
    { response: () => new Response("failure", { status: 503 }), code: "unavailable" },
    { response: () => new Response("not-json", { status: 200 }), code: "invalid-response" },
  ] as const;

  for (const entry of cases) {
    const adapter = new TisseoTransportAdapter({ apiKey: "test-key", fetcher: async () => entry.response() });
    await assert.rejects(
      () => adapter.searchPlaces({ query: "Capitole" }),
      (error) => error instanceof TransportProviderError && error.code === entry.code,
    );
  }

  const timeout = new TisseoTransportAdapter({
    apiKey: "test-key",
    fetcher: async () => { throw new DOMException("timed out", "TimeoutError"); },
  });
  await assert.rejects(
    () => timeout.searchPlaces({ query: "Capitole" }),
    (error) => error instanceof TransportProviderError && error.code === "timeout",
  );
});
