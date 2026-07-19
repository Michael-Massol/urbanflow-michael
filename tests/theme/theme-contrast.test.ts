import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => Number.parseInt(hex.slice(index, index + 2), 16) / 255);
  const [red = 0, green = 0, blue = 0] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05)
    / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function variablesFrom(styles: string, selector: RegExp): Record<string, string> {
  const block = selector.exec(styles)?.[1];
  assert.ok(block, `Bloc CSS introuvable : ${selector}`);
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)]
      .map((match) => [match[1], match[2]]),
  );
}

function color(palette: Record<string, string>, name: string): string {
  const value = palette[name];
  assert.ok(value, `Variable CSS introuvable : --${name}`);
  return value;
}

test("light and dark palettes meet WCAG AA contrast for essential text and controls", async () => {
  const styles = await readFile("src/app/globals.css", "utf8");
  const palettes = [
    variablesFrom(styles, /:root\s*\{([^}]*)\}/),
    variablesFrom(styles, /:root\[data-theme="dark"\]\s*\{([^}]*)\}/),
  ];

  for (const palette of palettes) {
    const contrastPairs = [
      ["text", "background"],
      ["muted", "background"],
      ["primary", "background"],
      ["on-primary", "primary"],
      ["danger", "danger-surface"],
      ["on-danger", "danger-strong"],
      ["warning-text", "warning-background"],
    ] as const;
    for (const [foreground, background] of contrastPairs) {
      assert.ok(
        contrast(color(palette, foreground), color(palette, background)) >= 4.5,
        `${foreground} doit avoir un contraste AA sur ${background}`,
      );
    }

    assert.ok(
      contrast(color(palette, "input-border"), color(palette, "input-background")) >= 3,
      "Les bordures de champs doivent rester perceptibles",
    );
    assert.ok(
      contrast(color(palette, "focus"), color(palette, "background")) >= 3,
      "L’indicateur de focus doit rester perceptible",
    );
  }
});
