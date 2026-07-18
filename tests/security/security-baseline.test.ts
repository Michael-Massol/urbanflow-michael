import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Next.js sends the V4 browser security baseline", async () => {
  const source = await readFile("next.config.ts", "utf8");
  for (const header of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "Cross-Origin-Opener-Policy",
  ]) assert.match(source, new RegExp(header));
  assert.match(source, /camera=\(\), microphone=\(\)/);
});

test("error boundaries present safe French messages without rendering error details", async () => {
  const [errorPage, globalError] = await Promise.all([
    readFile("src/app/error.tsx", "utf8"),
    readFile("src/app/global-error.tsx", "utf8"),
  ]);
  assert.doesNotMatch(errorPage, /error\.message|error\.stack|error\.digest/);
  assert.doesNotMatch(globalError, /error\.message|error\.stack|error\.digest/);
  assert.match(errorPage, /Aucun détail technique ni donnée personnelle/);
});
