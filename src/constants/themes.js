// src/constants/themes.js
// Central theme registry: add a theme here and it becomes available everywhere.
export const THEMES = Object.freeze([
  {
    id: "light",
    label: "Light",
    icon: "☀️",
  },
  {
    id: "dim",
    label: "Dim",
    icon: "🌗",
  },
  {
    id: "dark",
    label: "Dark",
    icon: "🌙",
  },
]);

export const DEFAULT_THEME = "light";

export function isValidTheme(id) {
  return THEMES.some(t => t.id === id);
}

export function normalizeTheme(id) {
  return isValidTheme(id) ? id : DEFAULT_THEME;
}
