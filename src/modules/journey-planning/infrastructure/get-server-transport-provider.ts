import "server-only";
import { TransportConfigurationError } from "../../transport/domain/errors.ts";
import { parseTransportConfig } from "../../transport/infrastructure/config/transport-config.ts";
import { selectTransportProvider } from "../../transport/infrastructure/config/select-transport-provider.ts";

export function getServerTransportProvider() {
  try {
    return selectTransportProvider(parseTransportConfig(process.env));
  } catch (error) {
    if (error instanceof TransportConfigurationError) throw error;
    throw new TransportConfigurationError("Invalid server transport configuration.");
  }
}
