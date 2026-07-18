import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { getValidationErrorMessage } from "../../src/modules/profile/application/get-validation-error-message.ts";
import { mobilityPreferencesSchema } from "../../src/modules/profile/domain/mobility-preferences.ts";

test("validation error formatter returns only the readable conflict message", () => {
  const result = mobilityPreferencesSchema.safeParse({
    preferredModes: ["metro"],
    avoidedModes: ["metro"],
    maxWalkingMinutes: 20,
    reducedMobility: false,
  });

  assert.equal(result.success, false);
  if (result.success) return;

  const message = getValidationErrorMessage(result.error);
  assert.equal(message, "Un mode ne peut pas être à la fois préféré et évité.");
  assert.doesNotMatch(message, /^\[/);
});

test("validation error formatter returns the first issue when several fields are invalid", () => {
  const schema = z.object({
    displayName: z.string().min(2, "Le nom affiché est trop court."),
    duration: z.number().positive("La durée doit être positive."),
  });
  const result = schema.safeParse({ displayName: "", duration: 0 });

  assert.equal(result.success, false);
  if (result.success) return;
  assert.equal(getValidationErrorMessage(result.error), "Le nom affiché est trop court.");
});
