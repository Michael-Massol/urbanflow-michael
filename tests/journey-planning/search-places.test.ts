import assert from "node:assert/strict";
import test from "node:test";
import { searchPlaces } from "../../src/modules/journey-planning/application/search-places.ts";
import { DemoTransportProvider } from "../../src/modules/transport/infrastructure/demo/demo-transport-provider.ts";

test("SearchPlaces rejects short input and never calls the provider", async () => {
  let called = false;
  const provider = new DemoTransportProvider();
  provider.searchPlaces = async () => { called = true; return []; };
  await assert.rejects(searchPlaces(provider, { query: " ", limit: 6 }), { name: "ZodError" });
  assert.equal(called, false);
});

test("SearchPlaces returns limited normalized places without provider DTO fields", async () => {
  const places = await searchPlaces(new DemoTransportProvider(), { query: "an", limit: 2 });
  assert.equal(places.length, 2);
  assert.ok(places.every((place) => place.source === "demo"));
  assert.equal("coordinates" in (places[0] ?? {}), false);
});
