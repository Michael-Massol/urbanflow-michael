export const THEME_STORAGE_KEY = "urbanflow-theme-preference";
export const LIGHT_THEME_COLOR = "#0b6b53";
export const DARK_THEME_COLOR = "#0f1715";

export const THEME_INITIALIZATION_SCRIPT = `(() => {
  const root = document.documentElement;
  const key = ${JSON.stringify(THEME_STORAGE_KEY)};
  const allowed = ["light", "dark", "system"];
  let stored = "system";
  try {
    const value = window.localStorage.getItem(key);
    if (value && allowed.includes(value)) stored = value;
  } catch {}
  const resolved = stored === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : stored;
  root.dataset.themePreference = stored;
  root.dataset.theme = resolved;
  root.style.colorScheme = resolved;
  const updateThemeColor = () => {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", resolved === "dark" ? ${JSON.stringify(DARK_THEME_COLOR)} : ${JSON.stringify(LIGHT_THEME_COLOR)});
  };
  updateThemeColor();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", updateThemeColor, { once: true });
  }
})();`;
