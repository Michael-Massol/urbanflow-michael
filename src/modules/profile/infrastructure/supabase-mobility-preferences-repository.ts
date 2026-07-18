import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MobilityMode,
  MobilityPreferences,
  MobilityPreferencesRepository,
} from "../domain/mobility-preferences.ts";

interface MobilityPreferencesRow {
  user_id: string;
  preferred_modes: MobilityMode[];
  avoided_modes: MobilityMode[];
  max_walking_minutes: number;
  reduced_mobility: boolean;
  updated_at: string;
}

const columns = "user_id, preferred_modes, avoided_modes, max_walking_minutes, reduced_mobility, updated_at";

function toDomain(row: MobilityPreferencesRow): MobilityPreferences {
  return {
    userId: row.user_id,
    preferredModes: row.preferred_modes,
    avoidedModes: row.avoided_modes,
    maxWalkingMinutes: row.max_walking_minutes,
    reducedMobility: row.reduced_mobility,
    updatedAt: row.updated_at,
  };
}

export class SupabaseMobilityPreferencesRepository implements MobilityPreferencesRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByUserId(userId: string): Promise<MobilityPreferences | null> {
    const { data, error } = await this.client
      .from("mobility_preferences")
      .select(columns)
      .eq("user_id", userId)
      .maybeSingle<MobilityPreferencesRow>();
    if (error) throw new Error("Impossible de charger les préférences de mobilité.");
    return data ? toDomain(data) : null;
  }

  async update(
    userId: string,
    preferences: Omit<MobilityPreferences, "userId" | "updatedAt">,
  ): Promise<MobilityPreferences> {
    const { data, error } = await this.client
      .from("mobility_preferences")
      .update({
        preferred_modes: preferences.preferredModes,
        avoided_modes: preferences.avoidedModes,
        max_walking_minutes: preferences.maxWalkingMinutes,
        reduced_mobility: preferences.reducedMobility,
      })
      .eq("user_id", userId)
      .select(columns)
      .single<MobilityPreferencesRow>();
    if (error || !data) throw new Error("Impossible de mettre à jour les préférences de mobilité.");
    return toDomain(data);
  }
}
