import assert from "node:assert/strict";
import test from "node:test";
import { getAuthenticatedUserId } from "../../src/modules/auth/application/get-authenticated-user-id.ts";

test("private-page guard rejects missing and invalid sessions", async () => {
  assert.equal(await getAuthenticatedUserId(async () => ({ data: { claims: null } })), null);
  assert.equal(
    await getAuthenticatedUserId(async () => {
      throw new Error("invalid session");
    }),
    null,
  );
});

test("private-page guard returns the authenticated owner id", async () => {
  assert.equal(
    await getAuthenticatedUserId(async () => ({ data: { claims: { sub: "user-a" } } })),
    "user-a",
  );
});
