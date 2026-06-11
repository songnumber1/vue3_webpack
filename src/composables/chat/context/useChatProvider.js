/**
 * @file composables/chat/context/useChatProvider.js
 * @description Chat 도메인의 provide 호출을 한 곳으로 모읍니다.
 */

import {provide} from "vue";
import {
  CHAT_ACTIONS_KEY,
  CHAT_WORKSPACE_STATE_KEY,
  PROMPT_STATE_KEY,
  PROMPT_TEXTAREA_STATE_KEY,
  PROMPT_TOOLBAR_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
} from "@/composables/chat/context/chatContextKeys";

export function provideChatActions(actions) {
  provide(CHAT_ACTIONS_KEY, actions);
}

export function provideChatWorkspaceState(state) {
  provide(CHAT_WORKSPACE_STATE_KEY, state);
}

export function providePromptState(state) {
  provide(PROMPT_STATE_KEY, state);
}

export function provideWorkspaceActions(actions) {
  provide(WORKSPACE_ACTIONS_KEY, actions);
}

export function providePromptTextareaState(state) {
  provide(PROMPT_TEXTAREA_STATE_KEY, state);
}

export function providePromptToolbarState(state) {
  provide(PROMPT_TOOLBAR_STATE_KEY, state);
}

export function provideChatContainerContext({
  chatActions,
  workspaceState,
  promptState,
  workspaceActions,
}) {
  provideChatActions(chatActions);
  provideChatWorkspaceState(workspaceState);
  providePromptState(promptState);
  provideWorkspaceActions(workspaceActions);
}
