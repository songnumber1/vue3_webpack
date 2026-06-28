/**
 * @file composables/chat/internal/policy/chatRoutePolicy.js
 * @description 일반 채팅 URL을 항상 숨김(/chat)으로 유지하는 라우트 정책 모듈입니다.
 */

import {ROUTE_NAMES} from "@/constants/routeNames";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {normalizeId as normalizeChatRouteId} from "@/utils/normalize";

export const CHAT_ENTRY_ROUTE_NAME = ROUTE_NAMES.CHAT_ENTRY;
export const CHAT_DETAIL_ROUTE_NAME = ROUTE_NAMES.CHAT_DETAIL;
export const ACTIVE_ROOM_TYPE_CHAT = ACTIVE_ROOM_TYPES.chat;

export function getActiveChatRoomId() {
  const chatStore = useChatStore();
  if (chatStore?.activeRoomType === ACTIVE_ROOM_TYPE_CHAT) {
    return normalizeChatRouteId(chatStore?.activeRoomId);
  }
  return normalizeChatRouteId(chatStore?.selectedChatId);
}

export function getPendingSelectedChatId() {
  return normalizeChatRouteId(useChatStore()?.pendingSelectedChatId);
}

export function hasPendingChatNavigation() {
  return Boolean(getPendingSelectedChatId());
}

export function resolveActiveChatId() {
  return getActiveChatRoomId();
}

export function createChatEntryRoute() {
  return {name: CHAT_ENTRY_ROUTE_NAME};
}

export function createConversationRoute() {
  return createChatEntryRoute();
}

export function applyConversationActiveRoom({chatId} = {}) {
  const id = normalizeChatRouteId(chatId);
  if (!id) return;
  useChatStore()?.setActiveChatRoom?.(id);
}

export function resolveConversationEntryGuard({to} = {}) {
  const chatStreamStore = useChatStreamStore();
  const activeChatRoomId = getActiveChatRoomId();
  const pendingChatRoomId = getPendingSelectedChatId();

  if (
    to?.name === ROUTE_NAMES.CHAT_ENTRY &&
    !activeChatRoomId &&
    !pendingChatRoomId &&
    !chatStreamStore?.isWait
  ) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  if (to?.name === ROUTE_NAMES.CHAT_DETAIL) {
    if (activeChatRoomId || pendingChatRoomId) {
      return {name: ROUTE_NAMES.CHAT_ENTRY, replace: true};
    }
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  return true;
}

export function resolveHiddenConversationRoute({route} = {}) {
  const activeChatRoomId = getActiveChatRoomId();
  const pendingChatRoomId = getPendingSelectedChatId();

  if (route?.name === ROUTE_NAMES.CHAT_DETAIL) {
    return {
      shouldRedirect: true,
      nextRoute:
        activeChatRoomId || pendingChatRoomId
          ? {name: ROUTE_NAMES.CHAT_ENTRY}
          : {name: ROUTE_NAMES.MAIN},
      nextActiveChatId: activeChatRoomId || pendingChatRoomId || null,
    };
  }

  if (
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
