import {inject, provide} from 'vue';

export const CHAT_HEADER_ACTIONS_KEY = Symbol('chat-header-actions');

const noop = () => {};

export function provideChatHeaderActions(actions = {}) {
  provide(CHAT_HEADER_ACTIONS_KEY, {
    openDrawer: actions.openDrawer || noop,
    toggleTheme: actions.toggleTheme || noop,
    openSwagger: actions.openSwagger || noop,
    openSettings: actions.openSettings || noop,
    openAssistant: actions.openAssistant || noop,
    openGuide: actions.openGuide || noop,
    openNotice: actions.openNotice || noop,
    openPersonalization: actions.openPersonalization || noop,
    openLanguage: actions.openLanguage || noop,
    openPlayground: actions.openPlayground || noop,
  });
}

export function useChatHeaderActions() {
  return inject(CHAT_HEADER_ACTIONS_KEY, {
    openDrawer: noop,
    toggleTheme: noop,
    openSwagger: noop,
    openSettings: noop,
    openAssistant: noop,
    openGuide: noop,
    openNotice: noop,
    openPersonalization: noop,
    openLanguage: noop,
    openPlayground: noop,
  });
}
