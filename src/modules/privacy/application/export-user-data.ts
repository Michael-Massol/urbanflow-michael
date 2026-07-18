import { getCarbonSummary } from "../../carbon-tracking/application/get-carbon-summary.ts";
import type { PrivacyDataRepository, UserDataExport } from "../domain/models.ts";
import { USER_DATA_EXPORT_VERSION } from "../domain/models.ts";

function withoutUserId<T extends { userId: string }>(value: T): Omit<T, "userId"> {
  return Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== "userId"),
  ) as Omit<T, "userId">;
}

export async function exportUserData(
  repository: PrivacyDataRepository,
  userId: string,
  generatedAt: Date = new Date(),
): Promise<UserDataExport> {
  if (!userId.trim()) throw new Error("Utilisateur non authentifié.");
  if (Number.isNaN(generatedAt.getTime())) throw new Error("Date d’export invalide.");

  const snapshot = await repository.getSnapshot(userId);
  if (snapshot.user.id !== userId) throw new Error("Export non autorisé.");

  return {
    exportVersion: USER_DATA_EXPORT_VERSION,
    generatedAt: generatedAt.toISOString(),
    user: {
      id: snapshot.user.id,
      email: snapshot.user.email,
      profile: snapshot.profile ? withoutUserId(snapshot.profile) : null,
      mobilityPreferences: snapshot.mobilityPreferences
        ? withoutUserId(snapshot.mobilityPreferences)
        : null,
    },
    completedJourneys: snapshot.completedJourneys.map(withoutUserId),
    carbonSummary: getCarbonSummary(snapshot.completedJourneys),
    metadata: {
      application: "UrbanFlow Mobility",
      release: "V4",
      scope: "Données personnelles enregistrées par UrbanFlow",
    },
  };
}
