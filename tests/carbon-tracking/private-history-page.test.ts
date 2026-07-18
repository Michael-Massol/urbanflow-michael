import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("history and confirmation require an authenticated user", async () => {
  const [page, route] = await Promise.all([
    readFile("src/app/historique/page.tsx", "utf8"),
    readFile("src/app/api/carbon/completed-journeys/route.ts", "utf8"),
  ]);
  assert.match(page, /if \(!userId\) redirect\("\/connexion"\)/);
  assert.match(route, /if \(!userId\)/);
  assert.match(route, /status: 401/);
});
