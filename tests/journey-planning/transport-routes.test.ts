import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("transport routes delegate to use cases and the configured server provider", async () => {
  const [placesRoute, journeysRoute, serverProvider] = await Promise.all([
    readFile("src/app/api/transport/places/route.ts", "utf8"),
    readFile("src/app/api/transport/journeys/route.ts", "utf8"),
    readFile("src/modules/journey-planning/infrastructure/get-server-transport-provider.ts", "utf8"),
  ]);
  assert.match(placesRoute, /searchPlaces\(getServerTransportProvider\(\)/);
  assert.match(journeysRoute, /planJourney\(getServerTransportProvider\(\)/);
  assert.match(serverProvider, /selectTransportProvider\(parseTransportConfig\(process\.env\)\)/);
  assert.doesNotMatch(`${placesRoute}\n${journeysRoute}\n${serverProvider}`, /DemoTransportProvider|TISSEO_API_KEY\s*=/);
});

test("Tisséo badges are driven by normalized provider and realtime metadata", async () => {
  const source = await readFile("src/modules/journey-planning/presentation/journey-results.tsx", "utf8");
  assert.match(source, /journey\.provider === "tisseo"/);
  assert.match(source, /journey\.realtime \? "Temps réel"/);
  assert.match(source, /"Horaires Tisséo"/);
});

test("the live smoke test skips without a key and never prints authentication material", async () => {
  const source = await readFile("scripts/test-tisseo-live.ts", "utf8");
  assert.match(source, /if \(!apiKey\)/);
  assert.match(source, /Smoke test Tisséo ignoré/);
  assert.doesNotMatch(source, /console\.(?:log|error)\([^\n]*apiKey/);
  assert.doesNotMatch(source, /searchParams\.set\("key"/);
});
