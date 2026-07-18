import "server-only";
import { createAdminSupabaseClient } from "../../supabase/infrastructure/admin-client.ts";
import type { UserAccountDeletionGateway } from "../domain/models.ts";

export class SupabaseUserAccountDeletionGateway implements UserAccountDeletionGateway {
  async deleteById(userId: string): Promise<void> {
    const { error } = await createAdminSupabaseClient().auth.admin.deleteUser(userId);
    if (error) throw new Error("Impossible de supprimer le compte.");
  }
}
