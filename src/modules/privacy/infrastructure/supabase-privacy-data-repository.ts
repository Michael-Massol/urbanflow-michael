import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseCompletedJourneyRepository } from "../../carbon-tracking/infrastructure/supabase-completed-journey-repository.ts";
import { SupabaseMobilityPreferencesRepository } from "../../profile/infrastructure/supabase-mobility-preferences-repository.ts";
import { SupabaseProfileRepository } from "../../profile/infrastructure/supabase-profile-repository.ts";
import type { PrivacyDataRepository, PrivacyDataSnapshot } from "../domain/models.ts";

export class SupabasePrivacyDataRepository implements PrivacyDataRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getSnapshot(userId: string): Promise<PrivacyDataSnapshot> {
    const { data, error } = await this.client.auth.getUser();
    if (error || !data.user || data.user.id !== userId || !data.user.email) {
      throw new Error("Impossible de charger les données personnelles.");
    }

    const [profile, mobilityPreferences, completedJourneys] = await Promise.all([
      new SupabaseProfileRepository(this.client).findByUserId(userId),
      new SupabaseMobilityPreferencesRepository(this.client).findByUserId(userId),
      new SupabaseCompletedJourneyRepository(this.client).listByUserId(userId),
    ]);

    return {
      user: { id: data.user.id, email: data.user.email },
      profile,
      mobilityPreferences,
      completedJourneys,
    };
  }
}
