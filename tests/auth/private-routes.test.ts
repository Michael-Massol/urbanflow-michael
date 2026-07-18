import assert from "node:assert/strict";
import test from "node:test";
import { isPrivatePagePath } from "../../src/modules/auth/application/private-routes.ts";

test("private page matcher covers user data pages without intercepting public pages or APIs", () => {
  for (const path of [
    "/dashboard",
    "/profil",
    "/historique",
    "/diagnostics/transport",
    "/confidentialite",
  ]) assert.equal(isPrivatePagePath(path), true, `${path} doit être privée`);

  for (const path of [
    "/",
    "/connexion",
    "/planifier",
    "/politique-de-confidentialite",
    "/api/privacy/export",
  ]) assert.equal(isPrivatePagePath(path), false, `${path} ne doit pas être interceptée`);
});
