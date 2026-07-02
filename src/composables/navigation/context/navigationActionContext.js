/**
 * @file composables/navigation/context/navigationActionContext.js
 * @description Sidebar/history 관련 action을 ChatLayout 중간 emit 없이 연결하기 위한 context입니다.
 */
import {inject, provide} from "vue";

export const NAVIGATION_ACTION_CONTEXT_KEY = Symbol(
  "NAVIGATION_ACTION_CONTEXT"
);

export function createEmptyNavigationActions() {
  return {
    handleHistoryMenuAction: null,
    openConversation: null,
    openNewConversation: null,
  };
}

export function provideNavigationActions(actions = {}) {
  provide(NAVIGATION_ACTION_CONTEXT_KEY, {
    ...createEmptyNavigationActions(),
    ...actions,
  });
}

export function useNavigationActions() {
  return inject(NAVIGATION_ACTION_CONTEXT_KEY, createEmptyNavigationActions());
}
