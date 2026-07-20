import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("persistent and dashboard navigation links do not prefetch routes", async () => {
  for (const path of [
    "src/modules/auth/presentation/session-navigation.tsx",
    "src/app/layout.tsx",
    "src/app/dashboard/page.tsx",
  ]) {
    const source = await readFile(path, "utf8");
    const links = source.match(/<Link\b[^>]*>/g) ?? [];

    assert.ok(links.length > 0, `${path} doit contenir au moins un lien Next.js.`);
    for (const link of links) assert.match(link, /prefetch=\{false\}/, `${path}: ${link}`);
  }
});
