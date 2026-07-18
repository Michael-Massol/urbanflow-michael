import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../../src/app/manifest.ts";

test("PWA manifest is installable and references both maskable icons", () => {
  const value = manifest();
  assert.equal(value.name, "UrbanFlow Mobility");
  assert.equal(value.display, "standalone");
  assert.equal(value.start_url, "/");
  assert.equal(value.id, "/");
  assert.equal(value.shortcuts?.[0]?.url, "/planifier");
  assert.deepEqual(value.icons?.map((icon) => icon.sizes), ["192x192", "512x512"]);
  assert.ok(value.icons?.every((icon) => icon.purpose === "maskable"));
});
