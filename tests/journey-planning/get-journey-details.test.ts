import assert from "node:assert/strict";
import test from "node:test";
import { getJourneyDetails } from "../../src/modules/journey-planning/application/get-journey-details.ts";
import type { Journey } from "../../src/modules/journey-planning/domain/models.ts";

const journey = { id: "demo-1" } as Journey;

test("GetJourneyDetails selects locally without a repository", () => {
  assert.equal(getJourneyDetails([journey], "demo-1"), journey);
  assert.equal(getJourneyDetails([journey], "missing"), null);
});
