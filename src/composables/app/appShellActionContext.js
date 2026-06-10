/**
 * @file composables/app/appShellActionContext.js
 * @description 앱 shell 전역 action provide/inject 키와 Null Object action을 제공합니다.
 */

export const APP_SHELL_ACTIONS_KEY = "APP_SHELL_ACTIONS";

export function createEmptyAppShellActions() {
  return {
    toggleTheme: () => {},
    openSwagger: () => {},
    openPlayground: () => {},
    openSettings: () => {},
    openGuide: () => {},
    openNotice: () => {},
    openPrivacy: () => {},
    openTerms: () => {},
    openPersonalization: () => {},
    openSystem: () => {},
    openLanguage: () => {},
    logout: () => {},
  };
}
