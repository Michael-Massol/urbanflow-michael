import { z } from "zod";
import type { Profile, ProfileRepository } from "../domain/profile.ts";
import {
  mobilityPreferencesSchema,
  type MobilityPreferences,
  type MobilityPreferencesRepository,
} from "../domain/mobility-preferences.ts";

const completeProfileSchema = z.object({
  userId: z.uuid(),
  displayName: z.string().trim().min(2, "Le nom affiché doit contenir au moins 2 caractères.").max(60),
  preferences: mobilityPreferencesSchema,
});

export interface CompleteProfile {
  profile: Profile;
  preferences: MobilityPreferences;
}

export async function updateCompleteProfile(
  profileRepository: ProfileRepository,
  preferencesRepository: MobilityPreferencesRepository,
  input: unknown,
): Promise<CompleteProfile> {
  const validated = completeProfileSchema.parse(input);
  const profile = await profileRepository.updateDisplayName(validated.userId, validated.displayName);
  const preferences = await preferencesRepository.update(validated.userId, validated.preferences);
  return { profile, preferences };
}
