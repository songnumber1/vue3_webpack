/**
 * @file composables/app/useAppShellThemeState.js
 * @description 앱 shell theme 표시 상태를 AppContainer와 workspace 계층이 공유하도록 제공합니다.
 */

import {ref} from "vue";

const themeName = ref("light");

export function useAppShellThemeState(initialTheme) {
  if (initialTheme) themeName.value = initialTheme;

  function setThemeName(nextTheme) {
    if (!nextTheme) return;
    themeName.value = nextTheme;
  }

  return {
    themeName,
    setThemeName,
  };
}
