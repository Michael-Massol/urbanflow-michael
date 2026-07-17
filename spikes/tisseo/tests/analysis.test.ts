import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeUrl, summarizePayload } from "../src/analysis.ts";

test("sanitizeUrl redacts authentication material", () => {
  const sanitized = sanitizeUrl("https://api.tisseo.fr/v2/places.json?term=capitole&key=secret");
  assert.match(sanitized, /key=%3Credacted%3E/);
  assert.doesNotMatch(sanitized, /secret/);
});

test("summarizePayload reports structure without copying values", () => {
  const payload = {
    places: [{ label: "Public test place", x: 1.44, y: 43.6 }],
    route: { coordinates: [[1.44, 43.6], [1.45, 43.61]] },
  };
  const summary = summarizePayload(payload);

  assert.deepEqual(summary.rootKeys, ["places", "route"]);
  assert.equal(summary.arrayLengths["$.places"], 1);
  assert.equal(summary.geometry[0]?.kind, "coordinate-sequence");
  assert.doesNotMatch(JSON.stringify(summary), /Public test place/);
  assert.doesNotMatch(JSON.stringify(summary), /43\.6/);
});
