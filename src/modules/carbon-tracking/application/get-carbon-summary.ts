import type { CarbonSummary, CompletedJourney } from "../domain/models.ts";

export function getCarbonSummary(journeys: readonly CompletedJourney[]): CarbonSummary {
  return journeys.reduce<CarbonSummary>((summary, journey) => ({
    journeyCount: summary.journeyCount + 1,
    emissionsGramsCo2e: summary.emissionsGramsCo2e + journey.emissionsGramsCo2e,
    carReferenceGramsCo2e: summary.carReferenceGramsCo2e + journey.carReferenceGramsCo2e,
    avoidedGramsCo2e: summary.avoidedGramsCo2e + journey.avoidedGramsCo2e,
  }), { journeyCount: 0, emissionsGramsCo2e: 0, carReferenceGramsCo2e: 0, avoidedGramsCo2e: 0 });
}
