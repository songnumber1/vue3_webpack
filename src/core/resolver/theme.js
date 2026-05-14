/**
 * @file theme.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

const THEME_KEY = "app_theme";
const allowedThemes = ["light", "dark"];

/**
 * resolveTheme 함수입니다.
 * @param {*} storage 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
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
