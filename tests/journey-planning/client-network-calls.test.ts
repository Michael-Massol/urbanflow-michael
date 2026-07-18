import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const clientFiles = [
  "src/modules/journey-planning/presentation/place-autocomplete.tsx",
  "src/modules/journey-planning/presentation/journey-planner.tsx",
];

test("journey-planning client calls use same-origin relative API URLs", async () => {
  const sources = await Promise.all(clientFiles.map((file) => readFile(file, "utf8")));
  const source = sources.join("\n");

  assert.match(source, /fetch\(`\/api\/transport\/places\?q=/);
  assert.match(source, /fetch\("\/api\/transport\/journeys"/);
  assert.doesNotMatch(source, /https?:\/\//);
  assert.doesNotMatch(source, /localhost|NEXT_PUBLIC_(?:APP|BASE|SITE)_URL/);
});
