import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("service worker provides network-first navigation and an offline fallback", async () => {
  const source = await readFile("public/sw.js", "utf8");
  assert.match(source, /const CACHE_NAME = "urbanflow-shell-v4"/);
  assert.match(source, /const OFFLINE_URL = "\/hors-ligne"/);
  assert.match(source, /"\/icons\/icon-192\.png"/);
  assert.match(source, /"\/icons\/icon-512\.png"/);
  assert.match(source, /"\/icons\/icon-maskable-512\.png"/);
  assert.match(source, /request\.mode !== "navigate"/);
  assert.match(source, /fetch\(request, \{ cache: "no-store" \}\)\.catch\(\(\) => caches\.match\(OFFLINE_URL\)\)/);
  assert.match(source, /url\.pathname\.startsWith\("\/api\/"\)/);
  assert.doesNotMatch(source, /cache\.put\(request/);
});
