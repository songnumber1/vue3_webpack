/**
 * @file composables/chat/internal/navigation/conversationUrlPolicy.js
 * @description 일반 대화방을 항상 /chat 엔트리 URL로 이동시키는 유틸입니다.
 */

export {
  ACTIVE_ROOM_TYPE_CHAT,
  CHAT_DETAIL_ROUTE_NAME,
  CHAT_ENTRY_ROUTE_NAME,
  applyConversationActiveRoom,
  createChatEntryRoute,
  createConversationRoute,
  getActiveChatRoomId,
  getPendingSelectedChatId,
  hasPendingChatNavigation,
  normalizeChatRouteId,
  resolveActiveChatId,
  resolveConversationEntryGuard,
  resolveHiddenConversationRoute,
} from "@/composables/chat/internal/policy/chatRoutePolicy";

import {
  applyConversationActiveRoom,
  createConversationRoute,
} from "@/composables/chat/internal/policy/chatRoutePolicy";

export async function navigateToConversation({
  router,
  chatStore,
  chatId,
  replace = true,
  query,
} = {}) {
  const route = {
    ...createConversationRoute({chatId}),
    ...(query ? {query} : {}),
  };

  // /chat 엔트리는 URL에 방 ID를 담지 않기 때문에 라우터 가드가
  // 정상적인 사용자 이동과 새로고침/직접 접근을 구분하려면 pending ID가 먼저 필요합니다.
  // 기존 호출부가 pending을 세팅하더라도 이 helper에서 한 번 더 보장해
  // sidebar/search/history 등 모든 일반 대화방 이동 경로의 첫 진입 race를 차단합니다.
  chatStore.setPendingSelectedChatId(chatId);

  try {
    if (replace) {
      return await router.replace(route);
    }

    return await router.push(route);
  } finally {
    // /chat 라우트 하나가 모든 일반 대화방을 공유하므로, 라우터 이동 시도 후
    // activeRoom을 갱신해 route watcher가 현재 방을 다시 로드하도록 보장합니다.
    applyConversationActiveRoom({chatId, chatStore});
  }
}
