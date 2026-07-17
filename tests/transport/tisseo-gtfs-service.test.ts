import assert from "node:assert/strict";
import test from "node:test";
import { resolve } from "node:path";
import { TisseoGtfsService } from "../../src/modules/transport/infrastructure/gtfs/tisseo-gtfs-service.ts";

const fixtureDirectory = resolve("tests/fixtures/gtfs");

test("loads and searches a small valid GTFS subset", async () => {
  const service = await TisseoGtfsService.load(fixtureDirectory);
  const stops = service.searchStops("matabiau");
  assert.equal(stops.length, 1);
  assert.equal(stops[0]?.id, "STOP_MATABIAU");
});

test("finds nearby stops ordered by distance", async () => {
  const service = await TisseoGtfsService.load(fixtureDirectory);
  const stops = service.findNearbyStops({ latitude: 43.6045, longitude: 1.4442 }, 1_000);
  assert.equal(stops[0]?.id, "STOP_CAPITOLE");
  assert.ok(stops.some((stop) => stop.id === "STOP_JAURES"));
});

test("identifies lines serving a stop", async () => {
  const service = await TisseoGtfsService.load(fixtureDirectory);
  const lines = service.getLinesServingStop("STOP_CAPITOLE");
  assert.deepEqual(lines.map((line) => line.shortName), ["14", "A"]);
});

test("returns a clear error when GTFS data is absent", async () => {
  await assert.rejects(TisseoGtfsService.load(resolve("tests/fixtures/missing-gtfs")), {
    name: "GtfsDataUnavailableError",
  });
});
