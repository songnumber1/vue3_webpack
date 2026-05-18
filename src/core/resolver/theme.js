const THEME_KEY = "app_theme";
const allowedThemes = ["light", "dark"];

/**
 * @description resolveTheme 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} storage - storage 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
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
