import type { JourneyGeometry } from "../../domain/models.ts";

const supportedGeometry = /^\s*(?:MULTI)?LINESTRING\s*\(/i;
const coordinatePair = /(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)\s+(-?\d+(?:\.\d+)?(?:e[+-]?\d+)?)/gi;

function isValidCoordinate(longitude: number, latitude: number): boolean {
  return Number.isFinite(longitude)
    && Number.isFinite(latitude)
    && longitude >= -180
    && longitude <= 180
    && latitude >= -90
    && latitude <= 90;
}

export function parseWktLineGeometry(value: string | undefined): JourneyGeometry | undefined {
  if (!value || !supportedGeometry.test(value)) return undefined;

  const coordinates: [number, number][] = [];
  for (const match of value.matchAll(coordinatePair)) {
    const longitude = Number(match[1]);
    const latitude = Number(match[2]);
    if (!isValidCoordinate(longitude, latitude)) return undefined;
    const previous = coordinates.at(-1);
    if (!previous || previous[0] !== longitude || previous[1] !== latitude) {
      coordinates.push([longitude, latitude]);
    }
  }

  return coordinates.length >= 2 ? { type: "LineString", coordinates } : undefined;
}

export function geometryDistanceMeters(geometry: JourneyGeometry): number {
  const earthRadiusMeters = 6_371_000;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  let distance = 0;

  for (let index = 1; index < geometry.coordinates.length; index += 1) {
    const previous = geometry.coordinates[index - 1];
    const current = geometry.coordinates[index];
    if (!previous || !current) continue;
    const latitudeDelta = radians(current[1] - previous[1]);
    const longitudeDelta = radians(current[0] - previous[0]);
    const firstLatitude = radians(previous[1]);
    const secondLatitude = radians(current[1]);
    const haversine = Math.sin(latitudeDelta / 2) ** 2
      + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
    distance += 2 * earthRadiusMeters * Math.asin(Math.sqrt(haversine));
  }

  return Math.round(distance);
}
