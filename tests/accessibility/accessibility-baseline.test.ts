import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the application exposes navigation landmarks, a skip link and a focusable main target", async () => {
  const layout = await readFile("src/app/layout.tsx", "utf8");
  assert.match(layout, /className="skip-link"/);
  assert.match(layout, /href="#main-content"/);
  assert.match(layout, /id="main-content" tabIndex=\{-1\}/);
  assert.match(layout, /<footer/);
});

test("privacy deletion uses labelled controls and announces validation errors", async () => {
  const form = await readFile("src/modules/privacy/presentation/delete-account-form.tsx", "utf8");
  assert.match(form, /htmlFor="confirmation"/);
  assert.match(form, /aria-describedby="account-deletion-help"/);
  assert.match(form, /role="alert"/);
  assert.match(form, /disabled=\{pending\}/);
});
