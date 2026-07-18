import { z } from "zod";
import type { CompletedJourneyRepository } from "../domain/models.ts";

const completedJourneyIdSchema = z.uuid("L’identifiant du trajet est invalide.");

export async function deleteCompletedJourney(
  repository: CompletedJourneyRepository,
  userId: string,
  journeyId: unknown,
): Promise<boolean> {
  if (!userId) throw new Error("Une session est requise pour supprimer un trajet.");
  return repository.deleteById(userId, completedJourneyIdSchema.parse(journeyId));
}
