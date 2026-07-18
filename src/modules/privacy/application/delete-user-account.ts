import { z } from "zod";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  type UserAccountDeletionGateway,
} from "../domain/models.ts";

const deleteUserAccountSchema = z.object({
  confirmation: z.literal(ACCOUNT_DELETION_CONFIRMATION, {
    error: `Saisissez exactement « ${ACCOUNT_DELETION_CONFIRMATION} » pour confirmer.`,
  }),
  acknowledge: z.literal("on", {
    error: "Confirmez que vous comprenez le caractère irréversible de la suppression.",
  }),
});

export async function deleteUserAccount(
  gateway: UserAccountDeletionGateway,
  userId: string,
  input: unknown,
): Promise<void> {
  if (!userId.trim()) throw new Error("Utilisateur non authentifié.");
  deleteUserAccountSchema.parse(input);
  await gateway.deleteById(userId);
}
