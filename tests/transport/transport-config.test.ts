import assert from "node:assert/strict";
import test from "node:test";
import { selectTransportProvider } from "../../src/modules/transport/infrastructure/config/select-transport-provider.ts";
import { parseTransportConfig } from "../../src/modules/transport/infrastructure/config/transport-config.ts";

test("defaults to the offline demo provider", () => {
  const config = parseTransportConfig({});
  assert.equal(config.TRANSPORT_PROVIDER, "demo");
  assert.equal(selectTransportProvider(config).descriptor.id, "demo");
});

test("requires a key when selecting Tisséo", () => {
  assert.throws(
    () => parseTransportConfig({ TRANSPORT_PROVIDER: "tisseo", TISSEO_API_KEY: "" }),
    { name: "ZodError" },
  );
});

test("selects the real Tisséo adapter when the server key is configured", () => {
  const config = parseTransportConfig({ TRANSPORT_PROVIDER: "tisseo", TISSEO_API_KEY: "configured" });
  const provider = selectTransportProvider(config);
  assert.equal(provider.descriptor.id, "tisseo");
  assert.equal(provider.descriptor.isDemo, false);
});
