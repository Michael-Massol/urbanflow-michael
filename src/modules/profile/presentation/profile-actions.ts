"use server";

import { revalidatePath } from "next/cache";
import { updateCompleteProfile } from "../application/update-complete-profile.ts";
import { SupabaseMobilityPreferencesRepository } from "../infrastructure/supabase-mobility-preferences-repository.ts";
import { SupabaseProfileRepository } from "../infrastructure/supabase-profile-repository.ts";
import { createUserSupabaseClient } from "@/modules/supabase/infrastructure/server-client";

export interface ProfileActionState {
  status: "idle" | "error" | "success";
  message?: string;
}

export async function updateProfileAction(
  _previousState: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  try {
    const client = await createUserSupabaseClient();
    const { data } = await client.auth.getClaims();
    const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : undefined;
    if (!userId) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };

    await updateCompleteProfile(
      new SupabaseProfileRepository(client),
      new SupabaseMobilityPreferencesRepository(client),
      {
        userId,
        displayName: formData.get("displayName"),
        preferences: {
          preferredModes: formData.getAll("preferredModes"),
          avoidedModes: formData.getAll("avoidedModes"),
          maxWalkingMinutes: Number(formData.get("maxWalkingMinutes")),
          reducedMobility: formData.get("reducedMobility") === "on",
        },
      },
    );
    revalidatePath("/profil");
    revalidatePath("/dashboard");
    return { status: "success", message: "Profil et préférences mis à jour." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossible de mettre à jour le profil.";
    return { status: "error", message };
  }
}
