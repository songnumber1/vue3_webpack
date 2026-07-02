/**
 * @file composables/chat/chatRoomActions.js
 * @description 모바일 전용 채팅방 라우트/선택 흐름을 직접 import 가능한 함수로 제공합니다.
 */

import {nextTick} from "vue";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";
import {ASSISTANT_PORTAL_IDS} from "@/constants/assistantPortal";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useAppShellStore} from "@/stores/appShellStore";
import {normalizeId as normalizeChatRouteId} from "@/utils/normalize";
import {normalizeChatId} from "@/utils/normalize";
import {cleanupActiveConversationForNavigation} from "@/composables/chat/conversation/activeConversationCleanupRegistry";

export const CHAT_ENTRY_ROUTE_NAME = ROUTE_NAMES.CHAT_ENTRY;
export const CHAT_DETAIL_ROUTE_NAME = ROUTE_NAMES.CHAT_DETAIL;
export const ACTIVE_ROOM_TYPE_CHAT = ACTIVE_ROOM_TYPES.chat;

const PORTAL_ROUTE_BY_ASSISTANT_ID = Object.freeze({
  [ASSISTANT_PORTAL_IDS.STUDIO]: ROUTE_NAMES.STUDIO,
  [ASSISTANT_PORTAL_IDS.CONNECTOR_STORE]: ROUTE_NAMES.CONNECTOR_STORE,
});

const PORTAL_ASSISTANT_ID_BY_ROUTE_NAME = Object.freeze({
  [ROUTE_NAMES.STUDIO]: ASSISTANT_PORTAL_IDS.STUDIO,
  [ROUTE_NAMES.CONNECTOR_STORE]: ASSISTANT_PORTAL_IDS.CONNECTOR_STORE,
});

function normalizePortalKey(value) {
  return String(value || "").trim();
}

function safeCall(callback, ...args) {
  if (typeof callback !== "function") return undefined;
  return callback(...args);
}

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

export function createChatRoomRoute() {
  return {name: CHAT_ENTRY_ROUTE_NAME};
}

export function markPendingChatRoom(chatId) {
  const id = normalizeChatId(chatId);
  if (!id) return "";
  useChatStore().setPendingSelectedChatId(id);
  return id;
}

export function clearPendingChatRoom(chatId = "") {
  const chatStore = useChatStore();
  const pendingId = normalizeChatId(chatStore.pendingSelectedChatId);
  const targetId = normalizeChatId(chatId);

  if (!targetId || pendingId === targetId) {
    chatStore.clearPendingSelectedChatId();
  }
}

export function applyActiveChatRoom(chatId) {
  const id = normalizeChatId(chatId);
  if (!id) return "";
  useChatStore()?.setActiveChatRoom?.(id);
  return id;
}

async function navigateChatRoom(router, chatId, navigationMethod = "replace") {
  const id = markPendingChatRoom(chatId);
  if (!id) return false;

  try {
    const route = createChatRoomRoute();
    const navigate =
      navigationMethod === "push" ? router?.push : router?.replace;
    await navigate?.call(router, route);
    applyActiveChatRoom(id);
    return true;
  } catch (_error) {
    clearPendingChatRoom(id);
    return false;
  }
}

export function enterChatRoom(router, chatId) {
  return navigateChatRoom(router, chatId, "replace");
}

export function openChatRoom(router, chatId) {
  return navigateChatRoom(router, chatId, "push");
}

export async function enterNewSubmitChatRoom(router, chatStreamStore, chatId) {
  const id = markPendingChatRoom(chatId);
  if (!id) return false;

  const route = createChatRoomRoute();
  chatStreamStore?.allowNavigationTo?.(route);

  try {
    await router?.push?.(route);
    applyActiveChatRoom(id);
    return true;
  } catch (_error) {
    chatStreamStore?.clearAllowedNavigation?.();
    clearPendingChatRoom(id);
    return false;
  }
}

export function getPortalAssistantRouteName(assistantId) {
  return (
    PORTAL_ROUTE_BY_ASSISTANT_ID[normalizePortalKey(assistantId)] ||
    ROUTE_NAMES.STUDIO
  );
}

export function createPortalAssistantRoute(assistantId) {
  return {name: getPortalAssistantRouteName(assistantId)};
}

export function getPortalAssistantIdByRouteName(routeName) {
  return PORTAL_ASSISTANT_ID_BY_ROUTE_NAME[normalizePortalKey(routeName)] || "";
}

export function isPortalRouteName(routeName) {
  return Boolean(getPortalAssistantIdByRouteName(routeName));
}

export function clearConversationNavigationState() {
  const chatStore = useChatStore();
  chatStore.clearPendingSelectedChatId?.();
  chatStore.clearActiveSession?.();
}

export function closeConversationNavigationPanels() {
  useAppShellStore().closeTransientShellPanels?.();
}

export function resetConversationStateForRouteChange() {
  clearConversationNavigationState();
  cleanupActiveConversationForNavigation();
  closeConversationNavigationPanels();
}

export function preparePortalConversationNavigation() {
  useChatStore().clearPendingSelectedChatId?.();
  closeConversationNavigationPanels();
}

export function cleanupAfterPortalConversationNavigation() {
  useChatStore().clearActiveSession?.();
  cleanupActiveConversationForNavigation();
}

export async function navigateToMainAfterConversationReset(
  router,
  clearBeforeNavigate
) {
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

export function resolveConversationEntryGuard(to) {
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

export function resolveHiddenConversationRoute(route) {
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
