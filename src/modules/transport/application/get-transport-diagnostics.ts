import { parseTransportConfig, type TransportConfig } from "../infrastructure/config/transport-config.ts";
import { DEMO_PROVIDER_NOTICE } from "../infrastructure/demo/demo-transport-provider.ts";

export interface CapabilityDiagnostic {
  status: "operational" | "error" | "not-applicable";
  detail?: string;
}

export interface LiveTransportDiagnostics {
  places: CapabilityDiagnostic;
  journeys: CapabilityDiagnostic;
  geometry: CapabilityDiagnostic;
  checkedAt: string;
}

export interface TransportDiagnostics {
  provider: "demo" | "tisseo";
  notice: string;
  keyConfigured: boolean;
  gtfsAvailable: boolean;
  places: CapabilityDiagnostic;
  journeys: CapabilityDiagnostic;
  geometry: CapabilityDiagnostic;
  checkedAt?: string;
  status: "operational" | "configuration-required" | "error";
}

const notApplicable = { status: "not-applicable", detail: "Non applicable au mode démonstration" } as const;

export async function getTransportDiagnostics(
  environment: Record<string, string | undefined>,
  isGtfsAvailable: (path: string) => Promise<boolean>,
  checkLiveProvider?: (config: TransportConfig) => Promise<LiveTransportDiagnostics>,
): Promise<TransportDiagnostics> {
  const provider = environment.TRANSPORT_PROVIDER === "tisseo" ? "tisseo" : "demo";
  const keyConfigured = Boolean(environment.TISSEO_API_KEY?.trim());
  const gtfsPath = environment.TISSEO_GTFS_PATH?.trim();
  const gtfsAvailable = gtfsPath ? await isGtfsAvailable(gtfsPath) : false;

  let config: TransportConfig;
  try {
    config = parseTransportConfig(environment);
  } catch {
    const unavailable = { status: "error", detail: "Configuration requise" } as const;
    return {
      provider,
      notice: provider === "demo" ? DEMO_PROVIDER_NOTICE : "Fournisseur Tisséo non opérationnel",
      keyConfigured,
      gtfsAvailable,
      places: unavailable,
      journeys: unavailable,
      geometry: unavailable,
      status: "configuration-required",
    };
  }

  if (provider === "demo") {
    return {
      provider,
      notice: DEMO_PROVIDER_NOTICE,
      keyConfigured,
      gtfsAvailable,
      places: notApplicable,
      journeys: notApplicable,
      geometry: notApplicable,
      status: "operational",
    };
  }

  if (!checkLiveProvider) {
    const notChecked = { status: "error", detail: "Diagnostic non exécuté" } as const;
    return {
      provider,
      notice: "Horaires Tisséo — informations temps réel non garanties",
      keyConfigured,
      gtfsAvailable,
      places: notChecked,
      journeys: notChecked,
      geometry: notChecked,
      status: "error",
    };
  }

  const live = await checkLiveProvider(config);
  const operational = [live.places, live.journeys, live.geometry]
    .every((capability) => capability.status === "operational");
  return {
    provider,
    notice: "Horaires Tisséo — informations temps réel non garanties",
    keyConfigured,
    gtfsAvailable,
    ...live,
    status: operational ? "operational" : "error",
  };
}
