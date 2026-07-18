import type { Journey } from "../../journey-planning/domain/models.ts";
import { calculateCarbonEstimate } from "../domain/calculate-carbon-estimate.ts";
import type { CompletedJourney, CompletedJourneyRepository } from "../domain/models.ts";

export async function confirmCompletedJourney(
  repository: CompletedJourneyRepository,
  userId: string,
  journey: Journey,
): Promise<CompletedJourney> {
  if (!userId) throw new Error("Une session est requise pour confirmer un trajet.");
  const first = journey.segments[0];
  const last = journey.segments.at(-1);
  if (!first || !last) throw new Error("Le trajet confirmé doit contenir au moins un segment.");
  const estimate = calculateCarbonEstimate(journey);
  return repository.create({
    userId,
    originLabel: first.origin.label,
    destinationLabel: last.destination.label,
    departureAt: journey.departureAt,
    arrivalAt: journey.arrivalAt,
    durationMinutes: journey.durationMinutes,
    distanceMeters: estimate.distanceMeters,
    modes: journey.modes,
    emissionsGramsCo2e: estimate.gramsCo2e,
    carReferenceGramsCo2e: estimate.carReferenceGramsCo2e,
    avoidedGramsCo2e: estimate.avoidedGramsCo2e,
    factorVersion: estimate.factorVersion,
    provider: journey.provider,
  });
}
