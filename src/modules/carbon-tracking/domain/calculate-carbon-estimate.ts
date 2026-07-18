import type { Journey } from "../../journey-planning/domain/models.ts";
import { emissionFactors, EMISSION_FACTOR_VERSION } from "./emission-factors.ts";
import type { CarbonEstimate } from "./models.ts";

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateCarbonEstimate(journey: Journey): CarbonEstimate {
  const segments = journey.segments.map((segment) => {
    if (segment.distanceMeters === undefined || !Number.isFinite(segment.distanceMeters) || segment.distanceMeters < 0) {
      throw new Error("La distance d’un segment est nécessaire au calcul carbone.");
    }
    return segment;
  });
  const distanceMeters = segments.reduce((total, segment) => total + (segment.distanceMeters ?? 0), 0);
  const gramsCo2e = segments.reduce(
    (total, segment) => total + ((segment.distanceMeters ?? 0) / 1_000) * emissionFactors[segment.mode].gramsCo2ePerPassengerKm,
    0,
  );
  const carReferenceGramsCo2e = (distanceMeters / 1_000) * emissionFactors.car_thermal_reference.gramsCo2ePerPassengerKm;
  return {
    gramsCo2e: round(gramsCo2e),
    carReferenceGramsCo2e: round(carReferenceGramsCo2e),
    avoidedGramsCo2e: round(Math.max(0, carReferenceGramsCo2e - gramsCo2e)),
    distanceMeters,
    factorVersion: EMISSION_FACTOR_VERSION,
  };
}
