import type { Journey } from "../domain/models.ts";

export function getJourneyDetails(journeys: readonly Journey[], journeyId: string): Journey | null {
  return journeys.find((journey) => journey.id === journeyId) ?? null;
}
