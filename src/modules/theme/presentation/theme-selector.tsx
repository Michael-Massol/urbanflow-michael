"use client";

import { useEffect, useRef } from "react";
import {
  isThemePreference,
  resolveThemePreference,
  type ThemePreference,
} from "../domain/theme-preference";
import {
  DARK_THEME_COLOR,
  LIGHT_THEME_COLOR,
  THEME_STORAGE_KEY,
} from "./theme-initialization";

function readStoredPreference(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function applyThemePreference(preference: ThemePreference): void {
  const resolved = resolveThemePreference(
    preference,
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const root = document.documentElement;
  root.dataset.themePreference = preference;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
}

export function ThemeSelector() {
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const stored = readStoredPreference();
    if (selectRef.current) selectRef.current.value = stored;
    applyThemePreference(stored);

    const handleSystemThemeChange = () => {
      const current = readStoredPreference();
      if (current === "system") applyThemePreference(current);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const next = isThemePreference(event.newValue) ? event.newValue : "system";
      if (selectRef.current) selectRef.current.value = next;
      applyThemePreference(next);
    };

    media.addEventListener("change", handleSystemThemeChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      media.removeEventListener("change", handleSystemThemeChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  function changePreference(next: ThemePreference) {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The selected theme still applies for the current page when storage is unavailable.
    }
    applyThemePreference(next);
  }

  return (
    <label className="theme-selector">
      <span>Thème</span>
      <select
        aria-label="Choisir le thème d’affichage"
        defaultValue="system"
        ref={selectRef}
        onChange={(event) => {
          if (isThemePreference(event.target.value)) changePreference(event.target.value);
        }}
      >
        <option value="light">Clair</option>
        <option value="dark">Sombre</option>
        <option value="system">Système</option>
      </select>
    </label>
  );
}
