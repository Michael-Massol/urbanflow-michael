import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("npm run probe loads the ignored local environment file", async () => {
  const rootPackageJson = JSON.parse(
    await readFile(new URL("../../../package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: Record<string, string>;
  };
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  ) as {
    scripts?: Record<string, string>;
  };
  const gitignore = await readFile(new URL("../.gitignore", import.meta.url), "utf8");

  assert.equal(rootPackageJson.scripts?.probe, "npm --prefix spikes/tisseo run probe");
  assert.match(packageJson.scripts?.probe ?? "", /--env-file-if-exists=\.env\.local/);
  assert.match(gitignore, /^\.env\.local$/m);
});
