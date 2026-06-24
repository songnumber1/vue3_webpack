/**
 * @file core/resolver/theme.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

const THEME_KEY = "app_theme";
const allowedThemes = ["light", "dark"];
export function resolveTheme(storage) {
  const stored = storage.get(THEME_KEY);
  const initial = allowedThemes.includes(stored) ? stored : "light";
  document.documentElement.dataset.theme = initial;

  return {
    current: initial,
    set(name) {
      const next = allowedThemes.includes(name) ? name : "light";
      document.documentElement.dataset.theme = next;
      storage.set(THEME_KEY, next);
      this.current = next;
    },
    toggle() {
      this.set(this.current === "dark" ? "light" : "dark");
    },
  };
}
