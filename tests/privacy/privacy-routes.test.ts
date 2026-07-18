import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("privacy page and export endpoint require an authenticated session", async () => {
  const [page, route] = await Promise.all([
    readFile("src/app/confidentialite/page.tsx", "utf8"),
    readFile("src/app/api/privacy/export/route.ts", "utf8"),
  ]);
  assert.match(page, /if \(!userId\) redirect\("\/connexion"\)/);
  assert.match(route, /if \(!userId\)/);
  assert.match(route, /status: 401/);
  assert.match(route, /private, no-store/);
});

test("the administrative client is isolated from browser code and account deletion stays server-side", async () => {
  const [adminClient, action, deletionInfrastructure, browserClient] = await Promise.all([
    readFile("src/modules/supabase/infrastructure/admin-client.ts", "utf8"),
    readFile("src/modules/privacy/presentation/privacy-actions.ts", "utf8"),
    readFile("src/modules/privacy/infrastructure/supabase-user-account-deletion-gateway.ts", "utf8"),
    readFile("src/modules/supabase/infrastructure/browser-client.ts", "utf8"),
  ]);
  assert.match(adminClient, /import "server-only"/);
  assert.match(action, /^"use server"/);
  assert.doesNotMatch(action, /createAdminSupabaseClient/);
  assert.match(deletionInfrastructure, /import "server-only"/);
  assert.match(deletionInfrastructure, /createAdminSupabaseClient/);
  assert.doesNotMatch(browserClient, /SUPABASE_SECRET_KEY|createAdminSupabaseClient/);
});

test("privacy export serializes an explicit model and never returns raw Supabase rows", async () => {
  const route = await readFile("src/app/api/privacy/export/route.ts", "utf8");
  assert.match(route, /exportUserData\(repository, userId\)/);
  assert.doesNotMatch(route, /\.from\(/);
  assert.doesNotMatch(route, /SUPABASE_SECRET_KEY/);
});
