import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the home login action is hidden when the server session is authenticated", async () => {
  const page = await readFile("src/app/page.tsx", "utf8");

  assert.match(page, /Boolean\(await getServerUserId\(\)\)/);
  assert.match(page, /!isAuthenticated \?/);
  assert.match(page, /J’ai déjà un compte/);
});
