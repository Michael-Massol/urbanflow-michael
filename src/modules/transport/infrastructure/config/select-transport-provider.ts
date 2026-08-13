import { TransportConfigurationError } from "../../domain/errors.ts";
import type { TransportProvider } from "../../domain/transport-provider.ts";
import { DemoTransportProvider } from "../demo/demo-transport-provider.ts";
import { TisseoTransportAdapter } from "../tisseo/tisseo-transport-adapter.ts";
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

  if (!config.TISSEO_API_KEY) {
    throw new TransportConfigurationError("TISSEO_API_KEY is required for the Tisséo provider.");
  }

  return dependencies.tisseo ?? new TisseoTransportAdapter({ apiKey: config.TISSEO_API_KEY });
}
