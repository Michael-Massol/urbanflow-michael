import assert from "node:assert/strict";
import test from "node:test";
import {
  isThemePreference,
  resolveThemePreference,
} from "../../src/modules/theme/domain/theme-preference.ts";

test("theme preferences accept only light, dark and system", () => {
  for (const value of ["light", "dark", "system"]) {
    assert.equal(isThemePreference(value), true);
  }
  for (const value of ["", "auto", "LIGHT", null, undefined, 1]) {
    assert.equal(isThemePreference(value), false);
  }
});

test("explicit theme preferences ignore the operating system theme", () => {
  assert.equal(resolveThemePreference("light", true), "light");
  assert.equal(resolveThemePreference("dark", false), "dark");
});

test("system preference follows the operating system theme", () => {
  assert.equal(resolveThemePreference("system", false), "light");
  assert.equal(resolveThemePreference("system", true), "dark");
});
