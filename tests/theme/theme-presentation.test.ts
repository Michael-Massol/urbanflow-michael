import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { THEME_INITIALIZATION_SCRIPT } from "../../src/modules/theme/presentation/theme-initialization.ts";

function runInitialization(stored: string | null, prefersDark: boolean) {
  const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string> };
  let themeColor = "";
  vm.runInNewContext(THEME_INITIALIZATION_SCRIPT, {
    window: {
      localStorage: { getItem: () => stored },
      matchMedia: () => ({ matches: prefersDark }),
    },
    document: {
      documentElement: root,
      readyState: "complete",
      addEventListener: () => undefined,
      querySelector: () => ({
        setAttribute: (_name: string, value: string) => { themeColor = value; },
      }),
    },
  });
  return { root, themeColor };
}

test("the theme is initialized before the page body and avoids a hydration mismatch", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8");
  assert.match(layout, /<head>/);
  assert.match(layout, /THEME_INITIALIZATION_SCRIPT/);
  assert.match(layout, /<html lang="fr" suppressHydrationWarning>/);
});

test("the accessible selector exposes light, dark and system preferences", async () => {
  const selector = await readFile(
    "src/modules/theme/presentation/theme-selector.tsx",
    "utf8",
  );
  assert.match(selector, /<span>Thème<\/span>/);
  assert.match(selector, /aria-label="Choisir le thème d’affichage"/);
  assert.match(selector, /value="light"/);
  assert.match(selector, /value="dark"/);
  assert.match(selector, /value="system"/);
  assert.match(selector, /localStorage\.setItem\(THEME_STORAGE_KEY, next\)/);
  assert.match(selector, /addEventListener\("change", handleSystemThemeChange\)/);
});

test("global styles define explicit dark colors and a system fallback", async () => {
  const styles = await readFile("src/app/globals.css", "utf8");
  assert.match(styles, /:root\[data-theme="dark"\]/);
  assert.match(styles, /@media \(prefers-color-scheme: dark\)/);
  assert.match(styles, /:root:not\(\[data-theme\]\)/);
  assert.match(styles, /color-scheme: dark/);
});

test("the initialization script applies persisted and system themes immediately", () => {
  const explicitLight = runInitialization("light", true);
  assert.equal(explicitLight.root.dataset.theme, "light");
  assert.equal(explicitLight.root.dataset.themePreference, "light");
  assert.equal(explicitLight.root.style.colorScheme, "light");
  assert.equal(explicitLight.themeColor, "#0b6b53");

  const systemDark = runInitialization("system", true);
  assert.equal(systemDark.root.dataset.theme, "dark");
  assert.equal(systemDark.root.dataset.themePreference, "system");
  assert.equal(systemDark.themeColor, "#0f1715");

  const invalid = runInitialization("unknown", false);
  assert.equal(invalid.root.dataset.theme, "light");
  assert.equal(invalid.root.dataset.themePreference, "system");
});
