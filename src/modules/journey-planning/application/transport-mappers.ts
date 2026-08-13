import type { JourneyLeg, JourneyOption, Place, TransportMode } from "../../transport/domain/models.ts";
import type { Journey, JourneyGeometry, JourneyMode, JourneyPlace, JourneySegment } from "../domain/models.ts";
import { mergeConsecutiveWalkingSegments } from "./merge-consecutive-walking-segments.ts";

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
  const optionDepartureAt = option.departureAt ?? departureAt;
  let cursor = optionDepartureAt;
  const normalizedSegments: JourneySegment[] = option.legs.map((leg) => {
    const segmentDeparture = leg.departureAt ?? cursor;
    const segmentArrival = leg.arrivalAt ?? new Date(segmentDeparture.getTime() + leg.durationMinutes * 60_000);
    cursor = segmentArrival;
    const geometry = legGeometry(leg);
    return {
      id: leg.id,
      mode: fromProviderMode[leg.mode],
      origin: toJourneyPlace(leg.from, provider.id),
      destination: toJourneyPlace(leg.to, provider.id),
      departureAt: segmentDeparture.toISOString(),
      arrivalAt: segmentArrival.toISOString(),
      durationMinutes: leg.durationMinutes,
      distanceMeters: leg.distanceMeters,
      ...(leg.lineName ? { lineName: leg.lineName } : {}),
      ...(leg.direction ? { direction: leg.direction } : leg.lineName ? { direction: leg.to.name } : {}),
      ...(leg.stopCount !== undefined ? { stopCount: leg.stopCount } : {}),
      ...(geometry ? { geometry } : {}),
      ...(leg.accessibility
        ? { accessibility: leg.accessibility }
        : provider.id === "demo"
          ? { accessibility: "Information non disponible en démonstration" }
          : {}),
    };
  });
  const segments = provider.id === "tisseo"
    ? mergeConsecutiveWalkingSegments(normalizedSegments)
    : normalizedSegments;
  const modes = [...new Set(segments.map((segment) => segment.mode))];
  const geometry = combinedGeometry(option.legs);
  return {
    id: option.id,
    departureAt: optionDepartureAt.toISOString(),
    arrivalAt: (option.arrivalAt ?? new Date(optionDepartureAt.getTime() + option.durationMinutes * 60_000)).toISOString(),
    durationMinutes: option.durationMinutes,
    walkingMinutes: Math.ceil(option.legs
      .filter((leg) => leg.mode === "walk")
      .reduce((total, leg) => total + (leg.durationSeconds ?? leg.durationMinutes * 60), 0) / 60),
    transferCount: option.transfers,
    modes,
    segments,
    ...(geometry ? { geometry } : {}),
    provider: provider.id,
    realtime: option.isRealTime,
    ...(provider.notice ? { notice: provider.notice } : {}),
  };
}
