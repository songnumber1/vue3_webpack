export const CHAT_ACTIONS_KEY = Symbol("CHAT_ACTIONS");

export function createEmptyChatActions() {
  return {
    openDrawer: () => {},
    toggleTheme: () => {},
    openSwagger: () => {},
    openSettings: () => {},
    openAssistant: () => {},
    openGuide: () => {},
    openNotice: () => {},
    openPersonalization: () => {},
    openLanguage: () => {},
    openPlayground: () => {},
  };
}
