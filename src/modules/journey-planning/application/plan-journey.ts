import type { TransportProvider } from "../../transport/domain/transport-provider.ts";
import { calculateCarbonEstimate } from "../../carbon-tracking/domain/calculate-carbon-estimate.ts";
import type { JourneyPlanResult } from "../domain/models.ts";
import { planJourneyInputSchema } from "../domain/schemas.ts";
import { sortJourneys } from "./sort-journeys.ts";
import { toJourney, toProviderMode, toProviderPlace } from "./transport-mappers.ts";

export async function planJourney(provider: TransportProvider, input: unknown): Promise<JourneyPlanResult> {
  const criteria = planJourneyInputSchema.parse(input);
  const avoided = new Set(criteria.avoidedModes);
  const allowedModes = Object.keys(toProviderMode)
    .filter((mode) => !avoided.has(mode as keyof typeof toProviderMode))
    .map((mode) => toProviderMode[mode as keyof typeof toProviderMode]);
  const departureAt = new Date(criteria.departureAt);
  const options = await provider.planJourney({
    originId: criteria.origin.id,
    destinationId: criteria.destination.id,
    origin: toProviderPlace(criteria.origin),
    destination: toProviderPlace(criteria.destination),
    departureAt,
    allowedModes,
  });
  const journeys = options
    .map((option) => toJourney(option, departureAt, provider.descriptor))
    .filter((journey) => journey.walkingMinutes <= criteria.maxWalkingMinutes)
    .map((journey) => ({ ...journey, carbonEstimate: calculateCarbonEstimate(journey) }));
  return {
    journeys: sortJourneys(journeys, "recommended", criteria.preferredModes),
    ...(provider.descriptor.notice ? { notice: provider.descriptor.notice } : {}),
    isDemo: provider.descriptor.isDemo,
    isRealTime: provider.descriptor.isRealTime,
  };
}
