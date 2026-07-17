import assert from "node:assert/strict";
import test from "node:test";
import { TransportConfigurationError } from "../../src/modules/transport/domain/errors.ts";
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

test("does not pretend that the future Tisséo adapter already exists", () => {
  const config = parseTransportConfig({ TRANSPORT_PROVIDER: "tisseo", TISSEO_API_KEY: "configured" });
  assert.throws(() => selectTransportProvider(config), TransportConfigurationError);
});
