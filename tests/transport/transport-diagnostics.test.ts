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
  const serialized = JSON.stringify(diagnostics);
  assert.doesNotMatch(serialized, new RegExp(secret));
  assert.doesNotMatch(serialized, /private\/gtfs/);
});
