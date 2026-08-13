import "server-only";
import { constants } from "node:fs";
import { access } from "node:fs/promises";
import {
  getTransportDiagnostics,
  type CapabilityDiagnostic,
  type LiveTransportDiagnostics,
} from "../application/get-transport-diagnostics.ts";
import { TransportProviderError } from "../domain/errors.ts";
import type { Place } from "../domain/models.ts";
import type { TransportConfig } from "./config/transport-config.ts";
import { TisseoTransportAdapter } from "./tisseo/tisseo-transport-adapter.ts";

async function canRead(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function capabilityError(error: unknown): CapabilityDiagnostic {
  if (error instanceof TransportProviderError) {
    if (error.code === "timeout") return { status: "error", detail: "Délai dépassé" };
    if (error.code === "invalid-response") return { status: "error", detail: "Réponse incompatible" };
    if (error.status) return { status: "error", detail: `Erreur HTTP ${error.status}` };
  }
  return { status: "error", detail: "Service indisponible" };
}

const capitole: Place = {
  id: "diagnostic-capitole",
  name: "Capitole",
  kind: "stop",
  coordinates: { longitude: 1.445537, latitude: 43.604465 },
};
const marengo: Place = {
  id: "diagnostic-marengo",
  name: "Marengo-SNCF",
  kind: "stop",
  coordinates: { longitude: 1.45554, latitude: 43.61037 },
};

async function checkTisseo(config: TransportConfig): Promise<LiveTransportDiagnostics> {
  const checkedAt = new Date().toISOString();
  const adapter = new TisseoTransportAdapter({ apiKey: config.TISSEO_API_KEY! });
  let places: CapabilityDiagnostic;
  let journeys: CapabilityDiagnostic;
  let geometry: CapabilityDiagnostic;

  try {
    const result = await adapter.searchPlaces({ query: "Capitole", limit: 1 });
    places = result.length > 0
      ? { status: "operational" }
      : { status: "error", detail: "Aucun lieu retourné" };
  } catch (error) {
    places = capabilityError(error);
  }

  try {
    const result = await adapter.planJourney({
      originId: capitole.id,
      destinationId: marengo.id,
      origin: capitole,
      destination: marengo,
      departureAt: new Date(Date.now() + 5 * 60_000),
      allowedModes: ["walk", "bus", "metro", "tram", "train"],
      maxWalkingMinutes: 20,
    });
    journeys = result.length > 0
      ? { status: "operational" }
      : { status: "error", detail: "Aucun trajet retourné" };
    geometry = result.some((journey) => journey.legs.some((leg) => leg.geometry))
      ? { status: "operational" }
      : { status: "error", detail: "Géométrie absente" };
  } catch (error) {
    journeys = capabilityError(error);
    geometry = capabilityError(error);
  }

  return { places, journeys, geometry, checkedAt };
}

export function getServerTransportDiagnostics() {
  return getTransportDiagnostics(process.env, canRead, checkTisseo);
}
