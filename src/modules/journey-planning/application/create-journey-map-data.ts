import type { Journey, JourneyGeometry, JourneyMode } from "../domain/models.ts";

export interface JourneyMapLine {
  id: string;
  mode: JourneyMode;
  geometry: JourneyGeometry;
}

export interface JourneyMapData {
  lines: JourneyMapLine[];
  origin: [number, number];
  destination: [number, number];
  coordinates: [number, number][];
}

export function createJourneyMapData(journey: Journey): JourneyMapData | null {
  const lines = journey.segments.flatMap((segment) => segment.geometry
    ? [{ id: segment.id, mode: segment.mode, geometry: segment.geometry }]
    : []);
  if (lines.length === 0 && journey.geometry) {
    lines.push({ id: `${journey.id}-combined`, mode: journey.modes[0] ?? "walking", geometry: journey.geometry });
  }
  const coordinates = lines.flatMap((line) => line.geometry.coordinates);
  const firstSegment = journey.segments[0];
  const lastSegment = journey.segments.at(-1);
  if (coordinates.length < 2 || !firstSegment || !lastSegment) return null;

  return {
    lines,
    origin: [firstSegment.origin.longitude, firstSegment.origin.latitude],
    destination: [lastSegment.destination.longitude, lastSegment.destination.latitude],
    coordinates,
  };
}
