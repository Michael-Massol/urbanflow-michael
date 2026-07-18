import assert from "node:assert/strict";
import test from "node:test";
import { deleteCompletedJourney } from "../../src/modules/carbon-tracking/application/delete-completed-journey.ts";
import type { CompletedJourneyRepository } from "../../src/modules/carbon-tracking/domain/models.ts";

const journeyId = "179a7dcc-90c1-46fb-8969-5537fb5ba653";

test("delete completed journey scopes deletion to the authenticated owner", async () => {
  let received: [string, string] | null = null;
  const repository = {
    async deleteById(userId: string, id: string) { received = [userId, id]; return true; },
  } as unknown as CompletedJourneyRepository;
  assert.equal(await deleteCompletedJourney(repository, "user-a", journeyId), true);
  assert.deepEqual(received, ["user-a", journeyId]);
});

test("delete completed journey rejects missing sessions and invalid identifiers", async () => {
  let called = false;
  const repository = {
    async deleteById() { called = true; return true; },
  } as unknown as CompletedJourneyRepository;
  await assert.rejects(deleteCompletedJourney(repository, "", journeyId), /session/);
  await assert.rejects(deleteCompletedJourney(repository, "user-a", "not-a-uuid"), { name: "ZodError" });
  assert.equal(called, false);
});
