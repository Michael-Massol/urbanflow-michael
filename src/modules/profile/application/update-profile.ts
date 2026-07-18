import { z } from "zod";
import type { Profile, ProfileRepository } from "../domain/profile.ts";

const updateProfileSchema = z.object({
  userId: z.uuid(),
  displayName: z.string().trim().min(2, "Le nom affiché doit contenir au moins 2 caractères.").max(60),
});

export async function updateProfile(
  repository: ProfileRepository,
  input: { userId: string; displayName: string },
): Promise<Profile> {
  const validated = updateProfileSchema.parse(input);
  return repository.updateDisplayName(validated.userId, validated.displayName);
}
