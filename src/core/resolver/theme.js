/**
 * @file core/resolver/theme.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
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
