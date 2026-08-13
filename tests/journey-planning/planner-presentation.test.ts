import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("planner hides the Tisséo availability notice while retaining the demo warning", async () => {
  const source = await readFile(
    "src/modules/journey-planning/presentation/journey-planner.tsx",
    "utf8",
  );

  assert.match(source, /provider\.isDemo/);
  assert.match(source, /Données de démonstration — non temps réel/);
  assert.doesNotMatch(source, /Horaires fournis par Tisséo/);
  assert.doesNotMatch(source, /<aside className="notice"/);
  assert.match(source, /result\.isDemo && result\.notice/);
});
