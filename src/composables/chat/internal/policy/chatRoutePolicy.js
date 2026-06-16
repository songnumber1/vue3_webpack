/**
 * @file composables/chat/internal/policy/chatRoutePolicy.js
 * @description 일반 채팅 URL을 항상 숨김(/chat)으로 유지하는 순수 라우트 정책 모듈입니다.
 */

import {ROUTE_NAMES} from "@/constants/routeNames";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";

export const CHAT_ENTRY_ROUTE_NAME = ROUTE_NAMES.CHAT_ENTRY;
export const CHAT_DETAIL_ROUTE_NAME = ROUTE_NAMES.CHAT_DETAIL;
export const ACTIVE_ROOM_TYPE_CHAT = ACTIVE_ROOM_TYPES.chat;

export function normalizeChatRouteId(value) {
  return String(value || "").trim();
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

export function hasPendingChatNavigation({chatStore} = {}) {
  return Boolean(getPendingSelectedChatId(chatStore));
}

export function resolveActiveChatId({chatStore} = {}) {
  return getActiveChatRoomId(chatStore);
}

export function createChatEntryRoute() {
  return {name: CHAT_ENTRY_ROUTE_NAME};
}

export function createConversationRoute() {
  return createChatEntryRoute();
}

export function applyConversationActiveRoom({chatId, chatStore} = {}) {
  const id = normalizeChatRouteId(chatId);
  if (!id) return;
  chatStore?.setActiveChatRoom?.(id);
}

export function resolveConversationEntryGuard({
  to,
  chatStore,
  chatStreamStore,
} = {}) {
  const activeChatRoomId = getActiveChatRoomId(chatStore);
  const pendingChatRoomId = getPendingSelectedChatId(chatStore);

  if (
    to?.name === ROUTE_NAMES.CHAT_ENTRY &&
    !activeChatRoomId &&
    !pendingChatRoomId &&
    !chatStreamStore?.isStreaming
  ) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  if (to?.name === ROUTE_NAMES.CHAT_DETAIL) {
    // 일반 대화방 ID는 URL에 노출하지 않습니다.
    // 이미 앱 내부에 활성/대기 중인 방이 있으면 /chat으로만 보정하고,
    // 새로고침/직접 접근처럼 복원 가능한 내부 상태가 없으면 메인으로 보냅니다.
    if (activeChatRoomId || pendingChatRoomId) {
      return {name: ROUTE_NAMES.CHAT_ENTRY, replace: true};
    }
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  return true;
}

export function resolveHiddenConversationRoute({route, chatStore} = {}) {
  const activeChatRoomId = getActiveChatRoomId(chatStore);
  const pendingChatRoomId = getPendingSelectedChatId(chatStore);

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
