import type { CarbonSummary, CompletedJourney } from "../../carbon-tracking/domain/models.ts";
import type { MobilityPreferences } from "../../profile/domain/mobility-preferences.ts";
import type { Profile } from "../../profile/domain/profile.ts";

export const USER_DATA_EXPORT_VERSION = "1.0" as const;
export const ACCOUNT_DELETION_CONFIRMATION = "SUPPRIMER MON COMPTE" as const;

export interface PrivacyDataSnapshot {
  user: {
    id: string;
    email: string;
  };
  profile: Profile | null;
  mobilityPreferences: MobilityPreferences | null;
  completedJourneys: CompletedJourney[];
}

export interface PrivacyDataRepository {
  getSnapshot(userId: string): Promise<PrivacyDataSnapshot>;
}

export interface UserAccountDeletionGateway {
  deleteById(userId: string): Promise<void>;
}

export type ExportedProfile = Omit<Profile, "userId">;
export type ExportedMobilityPreferences = Omit<MobilityPreferences, "userId">;
export type ExportedCompletedJourney = Omit<CompletedJourney, "userId">;

export interface UserDataExport {
  exportVersion: typeof USER_DATA_EXPORT_VERSION;
  generatedAt: string;
  user: {
    id: string;
    email: string;
    profile: ExportedProfile | null;
    mobilityPreferences: ExportedMobilityPreferences | null;
  };
  completedJourneys: ExportedCompletedJourney[];
  carbonSummary: CarbonSummary;
  metadata: {
    application: "UrbanFlow Mobility";
    release: "V4";
    scope: "Données personnelles enregistrées par UrbanFlow";
  };
}

export interface PrivacySummary {
  hasProfile: boolean;
  hasMobilityPreferences: boolean;
  completedJourneyCount: number;
  storesPreciseLocations: false;
}
