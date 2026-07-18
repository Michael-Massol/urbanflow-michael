import "server-only";
import { getServerUserId } from "../../auth/infrastructure/get-server-user-id.ts";
import { SupabaseMobilityPreferencesRepository } from "../../profile/infrastructure/supabase-mobility-preferences-repository.ts";
import { createUserSupabaseClient } from "../../supabase/infrastructure/server-client.ts";
import type { JourneyMode } from "../domain/models.ts";

const modeMap = {
  walking: "walking",
  bike: "bike",
  metro: "metro",
  bus: "bus",
  tram: "tram",
} as const satisfies Record<string, JourneyMode>;

export interface UserJourneyPreferences {
  preferredModes: JourneyMode[];
  avoidedModes: JourneyMode[];
  maxWalkingMinutes: number;
  reducedMobility: boolean;
}

export async function getUserJourneyPreferences(): Promise<UserJourneyPreferences | null> {
  const userId = await getServerUserId();
  if (!userId) return null;
  const client = await createUserSupabaseClient();
  const preferences = await new SupabaseMobilityPreferencesRepository(client).findByUserId(userId);
  if (!preferences) return null;
  return {
    preferredModes: preferences.preferredModes.map((mode) => modeMap[mode]),
    avoidedModes: preferences.avoidedModes.map((mode) => modeMap[mode]),
    maxWalkingMinutes: preferences.maxWalkingMinutes,
    reducedMobility: preferences.reducedMobility,
  };
}
