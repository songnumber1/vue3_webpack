export const CHAT_ACTIONS_KEY = Symbol("CHAT_ACTIONS");
export const WORKSPACE_ACTIONS_KEY = Symbol("WORKSPACE_ACTIONS");

export function createEmptyChatActions() {
  return {
    openDrawer: () => {},
    toggleTheme: () => {},
    openSwagger: () => {},
    openSettings: () => {},
    openAssistant: () => {},
    openGuide: () => {},
    openNotice: () => {},
    openPrivacy: () => {},
    openTerms: () => {},
    openPersonalization: () => {},
    openLanguage: () => {},
    openPlayground: () => {},
    logout: () => {},
  };
}

export function createEmptyWorkspaceActions() {
  return {
    submit: () => {},
    updateSelectedModel: () => {},
    handlePromptFocus: () => {},
    handlePromptResize: () => {},
    handleMessageContentRendered: () => {},
    scrollBottom: () => {},
  };
}
