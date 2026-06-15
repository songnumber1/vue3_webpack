/**
 * @file composables/chat/internal/navigation/chatNavigationReset.js
 * @description 채팅 화면을 벗어나거나 새 대화/포털로 이동할 때 필요한 reset 순서를 한 곳에서 관리합니다.
 * 이 파일은 UI를 변경하지 않고, 기존에 Sidebar/ChatContainer/NavigationActions에 흩어진
 * pending chat, history lock, active session, transient panel 정리 순서만 공통화합니다.
 */

import {nextTick} from "vue";
import {ROUTE_NAMES} from "@/constants/routeNames";

function safeCall(callback, ...args) {
  if (typeof callback !== "function") return undefined;
  return callback(...args);
}

function releaseChatHistoryLock({releaseLock, scope, owner = null} = {}) {
  if (!releaseLock || !scope) return;
  if (owner) {
    releaseLock(scope, owner);
    return;
  }
  releaseLock(scope);
}

export function clearConversationNavigationState({
  chatStore,
  releaseLock,
  chatHistoryScope,
  clearActiveSession,
} = {}) {
  safeCall(chatStore?.clearPendingSelectedChatId?.bind(chatStore));
  releaseChatHistoryLock({releaseLock, scope: chatHistoryScope});
  safeCall(clearActiveSession);
  safeCall(chatStore?.clearActiveSession?.bind(chatStore));
}

export function closeConversationNavigationPanels({
  navigationStore,
  closeAssistantSelector,
} = {}) {
  safeCall(navigationStore?.closeTransientPanels?.bind(navigationStore));
  safeCall(navigationStore?.setDrawerOpen?.bind(navigationStore), false);
  safeCall(
    navigationStore?.setCollapsedRecentOpen?.bind(navigationStore),
    false
  );
  safeCall(closeAssistantSelector);
}

export function resetConversationStateForRouteChange({
  chatStore,
  releaseLock,
  chatHistoryScope,
  clearActiveSession,
  cleanupActiveConversation,
  navigationStore,
  closeAssistantSelector,
} = {}) {
  clearConversationNavigationState({
    chatStore,
    releaseLock,
    chatHistoryScope,
    clearActiveSession,
  });
  safeCall(cleanupActiveConversation);
  closeConversationNavigationPanels({navigationStore, closeAssistantSelector});
}

export function preparePortalConversationNavigation({
  chatStore,
  releaseLock,
  chatHistoryScope,
  navigationStore,
  closeAssistantSelector,
} = {}) {
  safeCall(chatStore?.clearPendingSelectedChatId?.bind(chatStore));
  releaseChatHistoryLock({releaseLock, scope: chatHistoryScope});
  closeConversationNavigationPanels({navigationStore, closeAssistantSelector});
}

export function cleanupAfterPortalConversationNavigation({
  chatStore,
  clearActiveSession,
  cleanupActiveConversation,
} = {}) {
  safeCall(clearActiveSession);
  safeCall(chatStore?.clearActiveSession?.bind(chatStore));
  safeCall(cleanupActiveConversation);
}

export async function navigateToMainAfterConversationReset({
  router,
  clearBeforeNavigate,
} = {}) {
  if (!router) return;

  safeCall(clearBeforeNavigate);
  await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
  await nextTick();

  if (router.currentRoute?.value?.name !== ROUTE_NAMES.MAIN) {
    safeCall(clearBeforeNavigate);
    await router.push({name: ROUTE_NAMES.MAIN}).catch(() => {});
    await nextTick();
  }

  if (router.currentRoute?.value?.name !== ROUTE_NAMES.MAIN) {
    safeCall(clearBeforeNavigate);
    await router.replace("/").catch(() => {});
    await nextTick();
  }

  safeCall(clearBeforeNavigate);
}
