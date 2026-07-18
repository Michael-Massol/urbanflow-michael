import type { JourneyMode } from "../../journey-planning/domain/models.ts";

export type CarbonMode = JourneyMode | "car_thermal_reference";

export interface EmissionFactor {
  mode: CarbonMode;
  gramsCo2ePerPassengerKm: number;
  unit: "gCO2e/passenger-km";
  source: string;
  version: string;
  effectiveDate: string;
  comment: string;
}

export interface CarbonEstimate {
  gramsCo2e: number;
  carReferenceGramsCo2e: number;
  avoidedGramsCo2e: number;
  distanceMeters: number;
  factorVersion: string;
}

export interface CompletedJourney {
  id: string;
  userId: string;
  originLabel: string;
  destinationLabel: string;
  departureAt: string;
  arrivalAt: string;
  durationMinutes: number;
  distanceMeters: number;
  modes: JourneyMode[];
  emissionsGramsCo2e: number;
  carReferenceGramsCo2e: number;
  avoidedGramsCo2e: number;
  factorVersion: string;
  provider: string;
  confirmedAt: string;
}

export interface CarbonSummary {
  journeyCount: number;
  emissionsGramsCo2e: number;
  carReferenceGramsCo2e: number;
  avoidedGramsCo2e: number;
}

export type CompletedJourneyDraft = Omit<CompletedJourney, "id" | "confirmedAt">;

export interface CompletedJourneyRepository {
  create(journey: CompletedJourneyDraft): Promise<CompletedJourney>;
  listByUserId(userId: string): Promise<CompletedJourney[]>;
  deleteById(userId: string, journeyId: string): Promise<boolean>;
}
