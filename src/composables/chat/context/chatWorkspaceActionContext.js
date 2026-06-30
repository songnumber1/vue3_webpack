/**
 * @file composables/chat/context/chatWorkspaceActionContext.js
 * @description 메인/채팅 workspace의 도메인 action을 중간 emit 전달 없이 사용할 수 있도록 하는 context입니다.
 */
import {inject, provide} from "vue";

export const CHAT_WORKSPACE_ACTION_CONTEXT_KEY = Symbol(
  "CHAT_WORKSPACE_ACTION_CONTEXT"
);

export function createEmptyChatWorkspaceActions() {
  return {
    openStudioDetail: null,
    scrollBottom: null,
    refreshPromptViewport: null,
  };
}

export function provideChatWorkspaceActions(actions = {}) {
  provide(CHAT_WORKSPACE_ACTION_CONTEXT_KEY, {
    ...createEmptyChatWorkspaceActions(),
    ...actions,
  });
}

export function useChatWorkspaceActions() {
  return inject(
    CHAT_WORKSPACE_ACTION_CONTEXT_KEY,
    createEmptyChatWorkspaceActions()
  );
}
