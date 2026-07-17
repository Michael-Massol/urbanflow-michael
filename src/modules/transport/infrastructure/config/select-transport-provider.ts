import { TransportConfigurationError } from "../../domain/errors.ts";
import type { TransportProvider } from "../../domain/transport-provider.ts";
import { DemoTransportProvider } from "../demo/demo-transport-provider.ts";
import type { TransportConfig } from "./transport-config.ts";

export interface TransportProviderDependencies {
  demo?: TransportProvider;
  tisseo?: TransportProvider;
}

export function selectTransportProvider(
  config: TransportConfig,
  dependencies: TransportProviderDependencies = {},
): TransportProvider {
  if (config.TRANSPORT_PROVIDER === "demo") {
    return dependencies.demo ?? new DemoTransportProvider();
  }

  if (!dependencies.tisseo) {
    throw new TransportConfigurationError(
      "TRANSPORT_PROVIDER=tisseo is configured, but the real TisseoTransportAdapter has not been validated and registered.",
    );
  }

  return dependencies.tisseo;
}
