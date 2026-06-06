/**
 * @file composables/chat/navigation/conversationUrlPolicy.js
 * @description 일반 대화방 URL 노출/숨김 정책을 한 곳에서 관리합니다.
 */

import {CONVERSATION_URL_MODES} from "@/constants/systemSettings";

export const CHAT_ENTRY_ROUTE_NAME = "chat-entry";
export const CHAT_DETAIL_ROUTE_NAME = "chat";
export const ACTIVE_ROOM_TYPE_CHAT = "chat";

export function isHiddenConversationUrlMode(settings = {}) {
  return settings?.conversationUrlMode === CONVERSATION_URL_MODES.hidden;
}

export function resolveActiveChatId({route, chatStore, settings} = {}) {
  if (isHiddenConversationUrlMode(settings)) {
    return chatStore?.activeRoomType === ACTIVE_ROOM_TYPE_CHAT
      ? String(chatStore?.activeRoomId || "").trim()
      : "";
  }

  return String(route?.params?.id || "").trim();
}

export function createChatRoomRoute(chatId) {
  return {
    name: CHAT_DETAIL_ROUTE_NAME,
    params: {id: String(chatId || "").trim()},
  };
}

export function createChatEntryRoute() {
  return {name: CHAT_ENTRY_ROUTE_NAME};
}

export function createConversationRoute({chatId, settings} = {}) {
  const id = String(chatId || "").trim();

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
  const id = String(chatId || "").trim();
  if (!id) return;
  chatStore?.setActiveChatRoom?.(id);
}

export async function navigateToConversation({
  router,
  chatStore,
  settings,
  chatId,
  replace = false,
} = {}) {
  const route = createConversationRoute({chatId, settings});
  const navigate = replace ? router?.replace : router?.push;
  if (typeof navigate !== "function") {
    applyHiddenConversationActiveRoom({chatId, chatStore, settings});
    return;
  }

  try {
    return await navigate.call(router, route);
  } finally {
    // URL 숨김 모드에서는 /chat 라우트 자체가 여러 대화방을 공유합니다.
    // activeRoomId를 라우팅 이전에 먼저 바꾸면 현재 라우트가 아직 main인 상태에서
    // loadRouteConversation이 실행되어 첫 대화방 선택이 빈 화면으로 끝날 수 있습니다.
    // 따라서 라우팅 시도 이후에 activeRoom을 갱신하여 /chat 기준 로드가 한 번 더
    // 발생하도록 보장합니다. 중복 navigation인 경우에도 finally에서 activeRoom 갱신은 수행됩니다.
    applyHiddenConversationActiveRoom({chatId, chatStore, settings});
  }
}
