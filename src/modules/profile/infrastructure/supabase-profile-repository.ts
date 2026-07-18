import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, ProfileRepository } from "../domain/profile.ts";

interface ProfileRow {
  user_id: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

function toProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select("user_id, display_name, created_at, updated_at")
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>();
    if (error) throw new Error("Impossible de charger le profil.");
    return data ? toProfile(data) : null;
  }

  async updateDisplayName(userId: string, displayName: string): Promise<Profile> {
    const { data, error } = await this.client
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", userId)
      .select("user_id, display_name, created_at, updated_at")
      .single<ProfileRow>();
    if (error || !data) throw new Error("Impossible de mettre à jour le profil.");
    return toProfile(data);
  }
}
