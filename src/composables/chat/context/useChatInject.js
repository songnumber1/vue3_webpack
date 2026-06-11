/**
 * @file composables/chat/context/useChatInject.js
 * @description Chat 도메인의 inject 호출을 명시적인 composable로 감쌉니다.
 */

import {computed, inject} from "vue";
import {
  CHAT_ACTIONS_KEY,
  CHAT_WORKSPACE_STATE_KEY,
  PROMPT_STATE_KEY,
  PROMPT_TEXTAREA_STATE_KEY,
  PROMPT_TOOLBAR_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
} from "@/composables/chat/context/chatContextKeys";
import {
  createEmptyChatActions,
  createEmptyPromptState,
  createEmptyPromptToolbarState,
  createEmptyWorkspaceActions,
  createEmptyWorkspaceState,
} from "@/composables/chat/chatActionContext";

export function useChatActionsContext(fallback = createEmptyChatActions()) {
  return inject(CHAT_ACTIONS_KEY, fallback);
}

export function useChatWorkspaceStateContext(
  fallback = computed(createEmptyWorkspaceState)
) {
  return inject(CHAT_WORKSPACE_STATE_KEY, fallback);
}

export function usePromptStateContext(fallback = computed(createEmptyPromptState)) {
  return inject(PROMPT_STATE_KEY, fallback);
}

export function useWorkspaceActionsContext(
  fallback = createEmptyWorkspaceActions()
) {
  return inject(WORKSPACE_ACTIONS_KEY, fallback);
}

export function usePromptToolbarStateContext(
  fallback = computed(createEmptyPromptToolbarState)
) {
  return inject(PROMPT_TOOLBAR_STATE_KEY, fallback);
}

export function usePromptTextareaStateContext(fallback = null) {
  return inject(PROMPT_TEXTAREA_STATE_KEY, fallback);
}
