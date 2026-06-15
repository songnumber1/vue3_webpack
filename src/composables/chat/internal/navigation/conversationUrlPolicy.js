/**
 * @file composables/chat/internal/navigation/conversationUrlPolicy.js
 * @description 일반 대화방 URL 이동 유틸입니다. route 판단 정책은 chatRoutePolicy가 담당합니다.
 */

export {
  ACTIVE_ROOM_TYPE_CHAT,
  CHAT_DETAIL_ROUTE_NAME,
  CHAT_ENTRY_ROUTE_NAME,
  applyHiddenConversationActiveRoom,
  createChatEntryRoute,
  createChatRoomRoute,
  createConversationRoute,
  getActiveChatRoomId,
  getPendingSelectedChatId,
  hasPendingHiddenChatNavigation,
  isHiddenConversationUrlMode,
  normalizeChatRouteId,
  resolveActiveChatId,
  resolveConversationRouteReconciliation,
  resolveConversationUrlGuard,
} from "@/composables/chat/internal/policy/chatRoutePolicy";

import {
  applyHiddenConversationActiveRoom,
  createConversationRoute,
} from "@/composables/chat/internal/policy/chatRoutePolicy";

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
