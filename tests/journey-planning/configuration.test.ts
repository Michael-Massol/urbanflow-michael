import assert from "node:assert/strict";
import test from "node:test";
import { parseTransportConfig } from "../../src/modules/transport/infrastructure/config/transport-config.ts";
import { selectTransportProvider } from "../../src/modules/transport/infrastructure/config/select-transport-provider.ts";
import { noStoreHeaders, toSafeErrorResult } from "../../src/modules/journey-planning/infrastructure/http-response.ts";

test("demo mode works without a Tisseo key", () => {
  const provider = selectTransportProvider(parseTransportConfig({ TRANSPORT_PROVIDER: "demo", TISSEO_API_KEY: "" }));
  assert.equal(provider.descriptor.id, "demo");
});

test("Tisseo without key and unknown providers fail explicitly", () => {
  assert.throws(() => parseTransportConfig({ TRANSPORT_PROVIDER: "tisseo", TISSEO_API_KEY: "" }), { name: "ZodError" });
  assert.throws(() => parseTransportConfig({ TRANSPORT_PROVIDER: "unknown" }), { name: "ZodError" });
});

test("client-safe errors never expose configured keys or stacks", () => {
  const secret = "secret-tisseo-key";
  let error: unknown;
  try { parseTransportConfig({ TRANSPORT_PROVIDER: "tisseo", TISSEO_API_KEY: "" }); } catch (caught) { error = caught; }
  const safeResult = toSafeErrorResult(error);
  assert.equal(safeResult.status, "error");
  if (safeResult.status !== "error") return;
  const serialized = JSON.stringify(safeResult);
  assert.doesNotMatch(serialized, new RegExp(secret));
  assert.doesNotMatch(serialized, /stack/i);
  assert.doesNotMatch(safeResult.message, /^\[/);
  assert.equal(noStoreHeaders["Cache-Control"], "no-store, max-age=0");
});
