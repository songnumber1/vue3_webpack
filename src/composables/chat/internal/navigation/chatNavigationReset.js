/**
 * @file composables/chat/internal/navigation/chatNavigationReset.js
 * @description 채팅 화면을 벗어나거나 새 대화/포털로 이동할 때 필요한 reset 순서를 한 곳에서 관리합니다.
 */

import {nextTick} from "vue";
import {useChatStore} from "@/stores/chatStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {
  NAVIGATION_LOCK_SCOPES,
  useNavigationLockStore,
} from "@/stores/navigationLockStore";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {cleanupActiveConversationForNavigation} from "@/composables/chat/conversation/useActiveConversationCleanup";

function safeCall(callback, ...args) {
  if (typeof callback !== "function") return undefined;
  return callback(...args);
}

function releaseChatHistoryLock() {
  useNavigationLockStore().release(NAVIGATION_LOCK_SCOPES.chatHistory);
}

export function clearConversationNavigationState() {
  const chatStore = useChatStore();
  chatStore.clearPendingSelectedChatId?.();
  releaseChatHistoryLock();
  chatStore.clearActiveSession?.();
}

export function closeConversationNavigationPanels() {
  const navigationStore = useNavigationStore();
  navigationStore.closeTransientPanels?.();
  navigationStore.setDrawerOpen?.(false);
  navigationStore.setCollapsedRecentOpen?.(false);
}

export function resetConversationStateForRouteChange() {
  clearConversationNavigationState();
  cleanupActiveConversationForNavigation();
  closeConversationNavigationPanels();
}

export function preparePortalConversationNavigation() {
  useChatStore().clearPendingSelectedChatId?.();
  releaseChatHistoryLock();
  closeConversationNavigationPanels();
}

export function cleanupAfterPortalConversationNavigation() {
  useChatStore().clearActiveSession?.();
  cleanupActiveConversationForNavigation();
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
