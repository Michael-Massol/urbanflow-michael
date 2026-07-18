import type { PrivacyDataRepository, PrivacySummary } from "../domain/models.ts";

export async function getPrivacySummary(
  repository: PrivacyDataRepository,
  userId: string,
): Promise<PrivacySummary> {
  if (!userId.trim()) throw new Error("Utilisateur non authentifié.");
  const snapshot = await repository.getSnapshot(userId);
  if (snapshot.user.id !== userId) throw new Error("Consultation non autorisée.");

  return {
    hasProfile: snapshot.profile !== null,
    hasMobilityPreferences: snapshot.mobilityPreferences !== null,
    completedJourneyCount: snapshot.completedJourneys.length,
    storesPreciseLocations: false,
  };
}
