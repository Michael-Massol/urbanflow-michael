import assert from "node:assert/strict";
import test from "node:test";
import { getTransportDiagnostics } from "../../src/modules/transport/application/get-transport-diagnostics.ts";

test("transport diagnostic reports demo and GTFS state without exposing configuration", async () => {
  const secret = "never-expose-this-key";
  const localPath = "C:/private/gtfs";
  const diagnostics = await getTransportDiagnostics({
    TRANSPORT_PROVIDER: "demo",
    TISSEO_API_KEY: secret,
    TISSEO_GTFS_PATH: localPath,
  }, async (path) => path === localPath);

  assert.equal(diagnostics.provider, "demo");
  assert.equal(diagnostics.gtfsAvailable, true);
  assert.equal(diagnostics.status, "operational");
  assert.equal(diagnostics.places.status, "not-applicable");
  const serialized = JSON.stringify(diagnostics);
  assert.doesNotMatch(serialized, new RegExp(secret));
  assert.doesNotMatch(serialized, /private\/gtfs/);
});

test("transport diagnostic reports real Tisséo capabilities without exposing the key", async () => {
  const secret = "never-expose-this-live-key";
  const diagnostics = await getTransportDiagnostics({
    TRANSPORT_PROVIDER: "tisseo",
    TISSEO_API_KEY: secret,
  }, async () => false, async () => ({
    places: { status: "operational" },
    journeys: { status: "operational" },
    geometry: { status: "operational" },
    checkedAt: "2026-08-10T15:00:00.000Z",
  }));

  assert.equal(diagnostics.provider, "tisseo");
  assert.equal(diagnostics.keyConfigured, true);
  assert.equal(diagnostics.status, "operational");
  assert.equal(diagnostics.geometry.status, "operational");
  assert.doesNotMatch(JSON.stringify(diagnostics), new RegExp(secret));
});

test("transport diagnostic keeps provider failures explicit", async () => {
  const diagnostics = await getTransportDiagnostics({
    TRANSPORT_PROVIDER: "tisseo",
    TISSEO_API_KEY: "configured",
  }, async () => false, async () => ({
    places: { status: "operational" },
    journeys: { status: "error", detail: "Erreur HTTP 403" },
    geometry: { status: "error", detail: "Erreur HTTP 403" },
    checkedAt: "2026-08-10T15:00:00.000Z",
  }));

  assert.equal(diagnostics.status, "error");
  assert.equal(diagnostics.journeys.detail, "Erreur HTTP 403");
});
