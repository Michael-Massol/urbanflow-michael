import type { JourneyGeometry, JourneySegment } from "../domain/models.ts";

function sumAvailableDistances(segments: readonly JourneySegment[]): number | undefined {
  const distances = segments.flatMap((segment) =>
    segment.distanceMeters === undefined ? [] : [segment.distanceMeters],
  );
  return distances.length > 0
    ? distances.reduce((total, distance) => total + distance, 0)
    : undefined;
}

function concatenateGeometries(segments: readonly JourneySegment[]): JourneyGeometry | undefined {
  const coordinates = segments.flatMap((segment) => segment.geometry?.coordinates ?? []);
  const orderedCoordinates = coordinates.filter((coordinate, index) => {
    const previous = coordinates[index - 1];
    return !previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1];
  });
  return orderedCoordinates.length >= 2
    ? { type: "LineString", coordinates: orderedCoordinates }
    : undefined;
}

function coherentAccessibility(segments: readonly JourneySegment[]): string | undefined {
  const first = segments[0]?.accessibility;
  return first && segments.every((segment) => segment.accessibility === first)
    ? first
    : undefined;
}

function mergeWalkingGroup(segments: readonly JourneySegment[]): JourneySegment {
  const first = segments[0];
  const last = segments.at(-1);
  if (!first || !last) throw new Error("Cannot merge an empty walking segment group.");
  if (segments.length === 1) return first;

  const distanceMeters = sumAvailableDistances(segments);
  const geometry = concatenateGeometries(segments);
  const accessibility = coherentAccessibility(segments);

  return {
    id: `${first.id}--${last.id}`,
    mode: "walking",
    origin: first.origin,
    destination: last.destination,
    departureAt: first.departureAt,
    arrivalAt: last.arrivalAt,
    durationMinutes: segments.reduce((total, segment) => total + segment.durationMinutes, 0),
    ...(distanceMeters !== undefined ? { distanceMeters } : {}),
    ...(geometry ? { geometry } : {}),
    ...(accessibility ? { accessibility } : {}),
  };
}

export function mergeConsecutiveWalkingSegments(
  segments: readonly JourneySegment[],
): JourneySegment[] {
  const merged: JourneySegment[] = [];
  let walkingGroup: JourneySegment[] = [];

  const flushWalkingGroup = () => {
    if (walkingGroup.length === 0) return;
    merged.push(mergeWalkingGroup(walkingGroup));
    walkingGroup = [];
  };

  for (const segment of segments) {
    if (segment.mode === "walking") {
      walkingGroup.push(segment);
      continue;
    }
    flushWalkingGroup();
    merged.push(segment);
  }
  flushWalkingGroup();

  return merged;
}
