"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { getServerUserId } from "../../auth/infrastructure/get-server-user-id";
import { createUserSupabaseClient } from "../../supabase/infrastructure/server-client";
import { deleteUserAccount } from "../application/delete-user-account";
import { SupabaseUserAccountDeletionGateway } from "../infrastructure/supabase-user-account-deletion-gateway";

export interface DeleteAccountActionState {
  status: "idle" | "error";
  message?: string;
}

export async function deleteAccountAction(
  _previousState: DeleteAccountActionState,
  formData: FormData,
): Promise<DeleteAccountActionState> {
  const userId = await getServerUserId();
  if (!userId) return { status: "error", message: "Votre session a expiré. Reconnectez-vous." };

  try {
    await deleteUserAccount(
      new SupabaseUserAccountDeletionGateway(),
      userId,
      {
        confirmation: formData.get("confirmation"),
        acknowledge: formData.get("acknowledge"),
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        status: "error",
        message: error.issues[0]?.message ?? "La confirmation est invalide.",
      };
    }
    return {
      status: "error",
      message: "La suppression du compte est temporairement indisponible. Réessayez plus tard.",
    };
  }

  try {
    const client = await createUserSupabaseClient();
    await client.auth.signOut({ scope: "local" });
  } catch {
    // The account is already deleted; stale local session data cannot restore it.
  }

  revalidatePath("/", "layout");
  redirect("/?compte=supprime");
}
