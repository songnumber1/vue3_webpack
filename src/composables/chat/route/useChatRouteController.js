/**
 * @file composables/chat/route/useChatRouteController.js
 * @description ChatContainer route mode와 active conversation id를 계산하는 순수 route-state composable입니다.
 */

import {computed} from "vue";
import {resolveActiveChatId} from "@/composables/chat/policy/chatRoutePolicy";
import {ROUTE_NAMES} from "@/constants/routeNames";

/**
 * main/chat/shared route 상태와 현재 active id를 계산합니다.
 * API 호출, router 이동, store mutation은 하지 않습니다.
 */
export function useChatRouteController({
  props,
  route,
  chatStore,
  systemSettingsStore,
}) {
  const currentMode = computed(() => props.mode);
  const isMainPage = computed(() => currentMode.value === "main");
  const isChatPage = computed(() => currentMode.value === "chat");
  const isSharedPage = computed(() => currentMode.value === "shared");
  const isConversationPage = computed(
    () => isChatPage.value || isSharedPage.value
  );

  const activeHistoryId = computed(() => {
    if (isChatPage.value) {
      return resolveActiveChatId({
        route,
        chatStore,
        settings: systemSettingsStore.settings,
      });
    }

    if (isSharedPage.value) {
      return chatStore.activeRoomType === "shared"
        ? String(chatStore.activeRoomId || "").trim()
        : String(route.params?.id || route.params?.shareId || "").trim();
    }

    return null;
  });

  function getSharedEntryId() {
    if (route.name !== ROUTE_NAMES.SHARED_ENTRY) return "";
    return String(route.params?.id || route.params?.shareId || "").trim();
  }

  return {
    currentMode,
    isMainPage,
    isChatPage,
    isSharedPage,
    isConversationPage,
    activeHistoryId,
    getSharedEntryId,
  };
}
