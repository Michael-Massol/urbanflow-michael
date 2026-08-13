import type { Journey, JourneyGeometry } from "../../journey-planning/domain/models.ts";
import { journeyGeometrySchema } from "../../journey-planning/domain/schemas.ts";

function removeAdjacentDuplicates(
  coordinates: readonly [number, number][],
): [number, number][] {
  return coordinates.filter((coordinate, index) => {
    const previous = coordinates[index - 1];
    return !previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1];
  }).map(([longitude, latitude]) => [longitude, latitude]);
}

export function createStoredJourneyGeometry(journey: Journey): JourneyGeometry | null {
  const segmentCoordinates = journey.segments.flatMap(
    (segment) => segment.geometry?.coordinates ?? [],
  );
  const sourceCoordinates = segmentCoordinates.length >= 2
    ? segmentCoordinates
    : journey.geometry?.coordinates ?? [];
  const parsed = journeyGeometrySchema.safeParse({
    type: "LineString",
    coordinates: removeAdjacentDuplicates(sourceCoordinates),
  });

  return parsed.success ? parsed.data : null;
}
