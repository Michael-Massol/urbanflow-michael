import { TransportProviderError } from "../src/modules/transport/domain/errors.ts";
import type { Place } from "../src/modules/transport/domain/models.ts";
import { TisseoTransportAdapter } from "../src/modules/transport/infrastructure/tisseo/tisseo-transport-adapter.ts";

const apiKey = process.env.TISSEO_API_KEY?.trim();

if (!apiKey) {
  console.log("Smoke test Tisséo ignoré : TISSEO_API_KEY est absente.");
} else {
  const destination: Place = {
    id: "stop_area:SA_1373",
    name: "Matabiau Gare SNCF (Toulouse)",
    kind: "stop",
    coordinates: { longitude: 1.45288, latitude: 43.611141 },
  };

  try {
    const adapter = new TisseoTransportAdapter({ apiKey });
    const places = await adapter.searchPlaces({ query: "Capitole", limit: 1 });
    const origin = places[0];
    if (!origin) throw new Error("places-empty");
    const journeys = await adapter.planJourney({
      originId: origin.id,
      destinationId: destination.id,
      origin,
      destination,
      departureAt: new Date(Date.now() + 5 * 60_000),
      allowedModes: ["walk", "bus", "metro", "tram", "train"],
      maxWalkingMinutes: 20,
    });
    const geometryAvailable = journeys.some((journey) => journey.legs.some((leg) => leg.geometry));
    if (journeys.length === 0) throw new Error("journeys-empty");
    if (!geometryAvailable) throw new Error("geometry-empty");

    console.log(JSON.stringify({
      provider: adapter.descriptor.id,
      places: "operational",
      journeys: "operational",
      geometry: "operational",
      journeyCount: journeys.length,
      realtime: journeys.every((journey) => journey.isRealTime),
    }));
  } catch (error) {
    const safeFailure = error instanceof TransportProviderError
      ? { code: error.code, status: error.status ?? null }
      : { code: error instanceof Error ? error.message : "unknown", status: null };
    console.error(JSON.stringify({ provider: "tisseo", result: "error", ...safeFailure }));
    process.exitCode = 1;
  }
}
