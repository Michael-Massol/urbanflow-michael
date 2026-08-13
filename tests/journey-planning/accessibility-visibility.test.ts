import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { shouldShowAccessibility } from "../../src/modules/journey-planning/application/should-show-accessibility.ts";

test("accessibility details are hidden for anonymous users and absent preferences", () => {
  assert.equal(shouldShowAccessibility(null), false);
  assert.equal(shouldShowAccessibility(undefined), false);
});

test("accessibility details follow the authenticated reduced-mobility preference", () => {
  assert.equal(shouldShowAccessibility({ reducedMobility: false }), false);
  assert.equal(shouldShowAccessibility({ reducedMobility: true }), true);
});

test("the planner presentation uses only the server-derived accessibility flag", async () => {
  const [page, results] = await Promise.all([
    readFile("src/app/planifier/page.tsx", "utf8"),
    readFile("src/modules/journey-planning/presentation/journey-results.tsx", "utf8"),
  ]);

  assert.match(page, /shouldShowAccessibility\(userPreferences\)/);
  assert.match(results, /props\.showAccessibility \?/);
});
