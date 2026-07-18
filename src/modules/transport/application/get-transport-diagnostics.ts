import { parseTransportConfig } from "../infrastructure/config/transport-config.ts";
import { DEMO_PROVIDER_NOTICE } from "../infrastructure/demo/demo-transport-provider.ts";

export interface TransportDiagnostics {
  provider: "demo" | "tisseo";
  notice: string;
  gtfsAvailable: boolean;
  status: "operational" | "configuration-required" | "adapter-unavailable";
}

export async function getTransportDiagnostics(
  environment: Record<string, string | undefined>,
  isGtfsAvailable: (path: string) => Promise<boolean>,
): Promise<TransportDiagnostics> {
  const provider = environment.TRANSPORT_PROVIDER === "tisseo" ? "tisseo" : "demo";
  const gtfsPath = environment.TISSEO_GTFS_PATH?.trim();
  const gtfsAvailable = gtfsPath ? await isGtfsAvailable(gtfsPath) : false;

  try {
    parseTransportConfig(environment);
  } catch {
    return {
      provider,
      notice: provider === "demo" ? DEMO_PROVIDER_NOTICE : "Fournisseur Tisséo non opérationnel",
      gtfsAvailable,
      status: "configuration-required",
    };
  }

  if (provider === "tisseo") {
    return {
      provider,
      notice: "Adaptateur Tisséo en attente de validation",
      gtfsAvailable,
      status: "adapter-unavailable",
    };
  }

  return { provider, notice: DEMO_PROVIDER_NOTICE, gtfsAvailable, status: "operational" };
}
