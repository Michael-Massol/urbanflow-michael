import assert from "node:assert/strict";
import test from "node:test";
import { deleteUserAccount } from "../../src/modules/privacy/application/delete-user-account.ts";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  type UserAccountDeletionGateway,
} from "../../src/modules/privacy/domain/models.ts";

class SpyDeletionGateway implements UserAccountDeletionGateway {
  deletedUserIds: string[] = [];
  async deleteById(userId: string): Promise<void> {
    this.deletedUserIds.push(userId);
  }
}

test("account deletion delegates only after both explicit confirmations", async () => {
  const gateway = new SpyDeletionGateway();
  await deleteUserAccount(gateway, "user-a", {
    confirmation: ACCOUNT_DELETION_CONFIRMATION,
    acknowledge: "on",
  });
  assert.deepEqual(gateway.deletedUserIds, ["user-a"]);
});

test("account deletion rejects missing or incomplete confirmation without touching infrastructure", async () => {
  const gateway = new SpyDeletionGateway();
  await assert.rejects(
    deleteUserAccount(gateway, "user-a", { confirmation: "SUPPRIMER", acknowledge: "on" }),
  );
  await assert.rejects(
    deleteUserAccount(gateway, "user-a", { confirmation: ACCOUNT_DELETION_CONFIRMATION }),
  );
  await assert.rejects(
    deleteUserAccount(gateway, "", {
      confirmation: ACCOUNT_DELETION_CONFIRMATION,
      acknowledge: "on",
    }),
  );
  assert.deepEqual(gateway.deletedUserIds, []);
});
