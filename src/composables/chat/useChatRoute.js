/**
 * @file composables/chat/useChatRoute.js
 * @description 채팅 라우팅, URL 정책, 화면 전환 reset 관련 public 진입점입니다.
 */

export {useChatRouteController} from "@/composables/chat/internal/route/useChatRouteController";
export {useChatRouteLoader} from "@/composables/chat/internal/route/useChatRouteLoader";
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
export {
  isStudioConversationSession,
  markSessionAsMissingAssistant,
  resolveConversationSessionState,
  resolveDeletedStudioSessionState,
  resolveHistoryAssistantLabel,
} from "@/composables/chat/internal/policy/chatSessionPolicy";
export {
  resolveConversationTitle,
  resolveWorkspaceAssistantLabel,
} from "@/composables/chat/internal/policy/chatHeaderPolicy";
export {
  cleanupAfterPortalConversationNavigation,
  clearConversationNavigationState,
  closeConversationNavigationPanels,
  navigateToMainAfterConversationReset,
  preparePortalConversationNavigation,
  resetConversationStateForRouteChange,
} from "@/composables/chat/internal/navigation/chatNavigationReset";
export {navigateToConversation} from "@/composables/chat/internal/navigation/conversationUrlPolicy";
