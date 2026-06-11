/**
 * @file composables/chat/policy/chatRoutePolicy.js
 * @description Chat route의 source of truth를 hidden URL 기준으로 정리하는 순수 정책 모듈입니다.
 */

import {CONVERSATION_URL_MODES} from "@/constants/systemSettings";
import {ROUTE_NAMES} from "@/constants/routeNames";

export const CHAT_ENTRY_ROUTE_NAME = ROUTE_NAMES.CHAT_ENTRY;
export const CHAT_DETAIL_ROUTE_NAME = ROUTE_NAMES.CHAT_DETAIL;
export const ACTIVE_ROOM_TYPE_CHAT = "chat";

export function normalizeChatRouteId(value) {
  return String(value || "").trim();
}

export function isHiddenConversationUrlMode(settings = {}) {
  return settings?.conversationUrlMode === CONVERSATION_URL_MODES.hidden;
}

export function getActiveChatRoomId(chatStore) {
  if (chatStore?.activeRoomType === ACTIVE_ROOM_TYPE_CHAT) {
    return normalizeChatRouteId(chatStore?.activeRoomId);
  }
  return normalizeChatRouteId(chatStore?.selectedChatId);
}

export function getPendingSelectedChatId(chatStore) {
  return normalizeChatRouteId(chatStore?.pendingSelectedChatId);
}

export function hasPendingHiddenChatNavigation({chatStore, settings} = {}) {
  return (
    isHiddenConversationUrlMode(settings) &&
    Boolean(getPendingSelectedChatId(chatStore))
  );
}

export function resolveActiveChatId({route, chatStore, settings} = {}) {
  if (isHiddenConversationUrlMode(settings)) {
    return getActiveChatRoomId(chatStore);
  }

  return normalizeChatRouteId(route?.params?.id);
}

export function createChatRoomRoute(chatId) {
  return {
    name: CHAT_DETAIL_ROUTE_NAME,
    params: {id: normalizeChatRouteId(chatId)},
  };
}

export function createChatEntryRoute() {
  return {name: CHAT_ENTRY_ROUTE_NAME};
}

export function createConversationRoute({chatId, settings} = {}) {
  const id = normalizeChatRouteId(chatId);

  if (isHiddenConversationUrlMode(settings)) {
    return createChatEntryRoute();
  }

  return createChatRoomRoute(id);
}

export function applyHiddenConversationActiveRoom({
  chatId,
  chatStore,
  settings,
} = {}) {
  if (!isHiddenConversationUrlMode(settings)) return;
  const id = normalizeChatRouteId(chatId);
  if (!id) return;
  chatStore?.setActiveChatRoom?.(id);
}

export function resolveConversationUrlGuard({
  to,
  chatStore,
  chatStreamStore,
  settings,
} = {}) {
  const hiddenMode = isHiddenConversationUrlMode(settings);
  const activeChatRoomId = getActiveChatRoomId(chatStore);
  const pendingChatRoomId = getPendingSelectedChatId(chatStore);

  if (!hiddenMode && to?.name === ROUTE_NAMES.CHAT_ENTRY) {
    return activeChatRoomId
      ? {
          name: ROUTE_NAMES.CHAT_DETAIL,
          params: {id: activeChatRoomId},
          replace: true,
        }
      : {name: ROUTE_NAMES.MAIN, replace: true};
  }

  if (
    hiddenMode &&
    to?.name === ROUTE_NAMES.CHAT_ENTRY &&
    !activeChatRoomId &&
    !pendingChatRoomId &&
    !chatStreamStore?.isStreaming
  ) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  if (hiddenMode && to?.name === ROUTE_NAMES.CHAT_DETAIL) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  return true;
}

export function resolveConversationRouteReconciliation({
  route,
  chatStore,
  settings,
} = {}) {
  const hiddenMode = isHiddenConversationUrlMode(settings);
  const activeChatRoomId = getActiveChatRoomId(chatStore);
  const pendingChatRoomId = getPendingSelectedChatId(chatStore);

  if (hiddenMode && route?.name === ROUTE_NAMES.CHAT_DETAIL) {
    const routeChatId = normalizeChatRouteId(route?.params?.id);
    const nextChatId = activeChatRoomId || routeChatId;
    return {
      shouldRedirect: true,
      nextRoute: {name: ROUTE_NAMES.CHAT_ENTRY},
      nextActiveChatId: nextChatId,
    };
  }

  if (!hiddenMode && route?.name === ROUTE_NAMES.CHAT_ENTRY) {
    return {
      shouldRedirect: true,
      nextRoute: activeChatRoomId
        ? {
            name: ROUTE_NAMES.CHAT_DETAIL,
            params: {id: activeChatRoomId},
          }
        : {name: ROUTE_NAMES.MAIN},
    };
  }

  if (
    hiddenMode &&
    route?.name === ROUTE_NAMES.CHAT_ENTRY &&
    !activeChatRoomId &&
    !pendingChatRoomId
  ) {
    return {
      shouldRedirect: true,
      nextRoute: {name: ROUTE_NAMES.MAIN},
    };
  }

  return {shouldRedirect: false};
}
