import type { JourneyPlace } from "../domain/models.ts";
import { journeyPlaceSchema } from "../domain/schemas.ts";

export function createCurrentLocationPlace(latitude: number, longitude: number): JourneyPlace {
  return journeyPlaceSchema.parse({
    id: "current-location",
    label: "Ma position actuelle",
    type: "current_location",
    latitude,
    longitude,
    source: "browser",
  });
}
