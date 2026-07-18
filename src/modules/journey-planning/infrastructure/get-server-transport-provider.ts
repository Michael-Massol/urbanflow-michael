import "server-only";
import { parseTransportConfig } from "../../transport/infrastructure/config/transport-config.ts";
import { selectTransportProvider } from "../../transport/infrastructure/config/select-transport-provider.ts";

export function getServerTransportProvider() {
  return selectTransportProvider(parseTransportConfig(process.env));
}
