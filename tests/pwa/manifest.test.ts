import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import manifest from "../../src/app/manifest.ts";

test("PWA manifest is installable and references regular and maskable icons", () => {
  const value = manifest();
  assert.equal(value.name, "UrbanFlow Mobility");
  assert.equal(value.display, "standalone");
  assert.equal(value.start_url, "/");
  assert.equal(value.id, "/");
  assert.equal(value.background_color, "#0b6b53");
  assert.equal(value.shortcuts?.[0]?.url, "/planifier");
  assert.deepEqual(value.shortcuts?.[0]?.icons?.[0]?.src, "/icons/icon-192.png");
  assert.deepEqual(value.icons, [
    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ]);
});

test("PWA icon files are valid PNG images with the declared dimensions", async () => {
  for (const [path, expectedSize] of [
    ["public/icons/icon-192.png", 192],
    ["public/icons/icon-512.png", 512],
    ["public/icons/icon-maskable-512.png", 512],
  ] as const) {
    const image = await readFile(path);
    assert.deepEqual([...image.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(image.readUInt32BE(16), expectedSize);
    assert.equal(image.readUInt32BE(20), expectedSize);
  }
});
