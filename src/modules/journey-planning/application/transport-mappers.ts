import type { JourneyLeg, JourneyOption, Place, TransportMode } from "../../transport/domain/models.ts";
import type { Journey, JourneyGeometry, JourneyMode, JourneyPlace } from "../domain/models.ts";

export const toProviderMode: Record<JourneyMode, TransportMode> = {
  walking: "walk",
  bike: "bike",
  bus: "bus",
  metro: "metro",
  tram: "tram",
  train: "train",
};

const fromProviderMode: Record<TransportMode, JourneyMode> = {
  walk: "walking",
  bike: "bike",
  bus: "bus",
  metro: "metro",
  tram: "tram",
  train: "train",
};

export function toJourneyPlace(place: Place, source: string): JourneyPlace {
  return {
    id: place.id,
    label: place.name,
    type: place.kind === "current-location"
      ? "current_location"
      : place.kind === "stop" || place.kind === "station"
        ? "stop"
        : "point_of_interest",
    latitude: place.coordinates.latitude,
    longitude: place.coordinates.longitude,
    source,
    context: "Toulouse Métropole",
  };
}

export function toProviderPlace(place: JourneyPlace): Place {
  return {
    id: place.id,
    name: place.label,
    kind: place.type === "current_location" ? "current-location" : place.type === "stop" ? "stop" : "public-place",
    coordinates: { latitude: place.latitude, longitude: place.longitude },
  };
}

function legGeometry(leg: JourneyLeg): JourneyGeometry | undefined {
  return leg.geometry
    ? { type: "LineString", coordinates: leg.geometry.coordinates.map(([longitude, latitude]) => [longitude, latitude]) }
    : undefined;
}

function combinedGeometry(legs: readonly JourneyLeg[]): JourneyGeometry | undefined {
  const coordinates = legs.flatMap((leg) => leg.geometry?.coordinates ?? []);
  return coordinates.length >= 2
    ? { type: "LineString", coordinates: coordinates.map(([longitude, latitude]) => [longitude, latitude]) }
    : undefined;
}

export function toJourney(
  option: JourneyOption,
  departureAt: Date,
  provider: { id: string; notice?: string },
): Journey {
  let cursor = departureAt;
  const segments = option.legs.map((leg) => {
    const segmentDeparture = cursor;
    cursor = new Date(cursor.getTime() + leg.durationMinutes * 60_000);
    const geometry = legGeometry(leg);
    return {
      id: leg.id,
      mode: fromProviderMode[leg.mode],
      origin: toJourneyPlace(leg.from, provider.id),
      destination: toJourneyPlace(leg.to, provider.id),
      departureAt: segmentDeparture.toISOString(),
      arrivalAt: cursor.toISOString(),
      durationMinutes: leg.durationMinutes,
      distanceMeters: leg.distanceMeters,
      ...(leg.lineName ? { lineName: leg.lineName } : {}),
      ...(leg.lineName ? { direction: leg.to.name } : {}),
      ...(geometry ? { geometry } : {}),
      accessibility: "Information non disponible en démonstration",
    };
  });
  const modes = [...new Set(segments.map((segment) => segment.mode))];
  const geometry = combinedGeometry(option.legs);
  return {
    id: option.id,
    departureAt: departureAt.toISOString(),
    arrivalAt: new Date(departureAt.getTime() + option.durationMinutes * 60_000).toISOString(),
    durationMinutes: option.durationMinutes,
    walkingMinutes: segments.filter((segment) => segment.mode === "walking").reduce((total, segment) => total + segment.durationMinutes, 0),
    transferCount: option.transfers,
    modes,
    segments,
    ...(geometry ? { geometry } : {}),
    provider: provider.id,
    realtime: option.isRealTime,
    ...(provider.notice ? { notice: provider.notice } : {}),
  };
}
