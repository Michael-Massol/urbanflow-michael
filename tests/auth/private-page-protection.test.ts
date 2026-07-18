import assert from "node:assert/strict";
import test from "node:test";
import { getAuthenticatedUserId } from "../../src/modules/auth/application/get-authenticated-user-id.ts";
import { readFile } from "node:fs/promises";

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

test("the session proxy redirects anonymous private-page requests before rendering", async () => {
  const source = await readFile("src/modules/supabase/infrastructure/update-session.ts", "utf8");
  assert.match(source, /isPrivatePagePath\(request\.nextUrl\.pathname\)/);
  assert.match(source, /NextResponse\.redirect\(destination\)/);
  assert.match(source, /destination\.pathname = "\/connexion"/);
});
