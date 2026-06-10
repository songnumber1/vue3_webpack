/**
 * @file composables/chat/header/useChatHeaderActions.js
 * @description ChatHeader에서 필요한 header action만 제공합니다.
 * ChatHeader가 CHAT_ACTIONS_KEY / APP_SHELL_ACTIONS_KEY를 직접 알지 않도록 중간 계층을 둡니다.
 */

import {inject} from "vue";
import {
  CHAT_ACTIONS_KEY,
  createEmptyChatActions,
} from "@/composables/chat/chatActionContext";
import {
  APP_SHELL_ACTIONS_KEY,
  createEmptyAppShellActions,
} from "@/composables/app/appShellActionContext";

export function useChatHeaderActions() {
  const chatActions = inject(CHAT_ACTIONS_KEY, createEmptyChatActions());
  const appShellActions = inject(
    APP_SHELL_ACTIONS_KEY,
    createEmptyAppShellActions()
  );

  function openDrawer() {
    chatActions.openDrawer?.();
  }

  function openAssistant() {
    chatActions.openAssistant?.();
  }

  function openSettings() {
    appShellActions.openSettings?.();
  }

  return {
    openDrawer,
    openAssistant,
    openSettings,
  };
}
