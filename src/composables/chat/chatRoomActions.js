/**
 * @file composables/chat/chatRoomActions.js
 * @description 모바일 전용 채팅방 라우트/선택 흐름을 직접 import 가능한 함수로 제공합니다.
 */

import {nextTick} from "vue";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";
import {ASSISTANT_PORTAL_IDS} from "@/constants/assistantPortal";
import {useChatStore} from "@/stores/chatStore";
import {useAppShellStore} from "@/stores/appShellStore";
import {normalizeId as normalizeChatRouteId} from "@/utils/normalize";
import {normalizeChatId} from "@/utils/normalize";
import {isSharedChat} from "@/composables/chat/internal/message-list/useMessageRenderPolicy";

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
  if (chatStore.activeRoomType === ACTIVE_ROOM_TYPE_CHAT) {
    return normalizeChatRouteId(chatStore.activeRoomId);
  }
  return normalizeChatRouteId(chatStore.selectedChatId);
}

export function createChatRoomRoute() {
  return {name: CHAT_ENTRY_ROUTE_NAME};
}

export function markPendingChatRoom(chatId) {
  return applyActiveChatRoom(chatId);
}

export function clearPendingChatRoom() {
  // selectedChatId를 직접 사용하므로 별도 pending 상태는 유지하지 않습니다.
}

export function applyActiveChatRoom(chatId) {
  const id = normalizeChatId(chatId);
  if (!id) return "";
  useChatStore().setActiveChatRoom(id);
  return id;
}

async function navigateChatRoom(
  router,
  chatId,
  navigationMethod = "replace",
  {searchTargetMessageId = "", initialScrollType = "last"} = {}
) {
  const id = applyActiveChatRoom(chatId);
  if (!id) return false;

  const chatStore = useChatStore();
  const targetMessageId = String(searchTargetMessageId || "").trim();
  const selectedHistory = chatStore.getHistory(id);
  const resolvedInitialScrollType = isSharedChat(selectedHistory)
    ? "top"
    : initialScrollType || "last";

  chatStore.setSearchTargetMessageId(targetMessageId);
  chatStore.setInitialScrollRequest(
    targetMessageId
      ? {type: "message", messageId: targetMessageId}
      : {type: resolvedInitialScrollType}
  );

  try {
    const route = createChatRoomRoute();
    const navigate =
      navigationMethod === "push" ? router?.push : router?.replace;
    await navigate?.call(router, route);
    return true;
  } catch (_error) {
    if (normalizeChatId(chatStore.selectedChatId) === id) {
      chatStore.clearActiveSession();
    }
    return false;
  }
}

export function enterChatRoom(router, chatId, options) {
  return navigateChatRoom(router, chatId, "replace", options);
}

export function openChatRoom(router, chatId, options) {
  return navigateChatRoom(router, chatId, "push", options);
}

export async function enterNewSubmitChatRoom(router, chatId) {
  const id = applyActiveChatRoom(chatId);
  if (!id) return false;
  const chatStore = useChatStore();
  chatStore.clearSearchTargetMessageId();
  chatStore.clearInitialScrollRequest();

  try {
    const route = createChatRoomRoute();
    if (router?.currentRoute?.value?.name !== CHAT_ENTRY_ROUTE_NAME) {
      await router?.push?.(route);
    }
    return true;
  } catch (_error) {
    if (normalizeChatId(useChatStore().selectedChatId) === id) {
      useChatStore().clearActiveSession();
    }
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
  chatStore.clearSearchTargetMessageId();
  chatStore.clearActiveSession();
}

export function closeConversationNavigationPanels() {
  useAppShellStore().closeTransientShellPanels();
}

export function resetConversationStateForRouteChange() {
  clearConversationNavigationState();
  closeConversationNavigationPanels();
}

export function preparePortalConversationNavigation() {
  const chatStore = useChatStore();
  chatStore.clearSearchTargetMessageId();
  chatStore.clearInitialScrollRequest();
  closeConversationNavigationPanels();
}

export function cleanupAfterPortalConversationNavigation() {
  useChatStore().clearActiveSession();
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
  const chatStore = useChatStore();
  const activeChatRoomId = getActiveChatRoomId();
  if (
    to?.name === ROUTE_NAMES.CHAT_ENTRY &&
    !activeChatRoomId &&
    !chatStore.input
  ) {
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  if (to?.name === ROUTE_NAMES.CHAT_DETAIL) {
    if (activeChatRoomId) {
      return {name: ROUTE_NAMES.CHAT_ENTRY, replace: true};
    }
    return {name: ROUTE_NAMES.MAIN, replace: true};
  }

  return true;
}

export function resolveHiddenConversationRoute(route) {
  const chatStore = useChatStore();
  const activeChatRoomId = getActiveChatRoomId();

  if (route?.name === ROUTE_NAMES.CHAT_DETAIL) {
    return {
      shouldRedirect: true,
      nextRoute: activeChatRoomId
        ? {name: ROUTE_NAMES.CHAT_ENTRY}
        : {name: ROUTE_NAMES.MAIN},
      nextActiveChatId: activeChatRoomId || null,
    };
  }

  if (
    route?.name === ROUTE_NAMES.CHAT_ENTRY &&
    !activeChatRoomId &&
    !chatStore.input
  ) {
    return {
      shouldRedirect: true,
      nextRoute: {name: ROUTE_NAMES.MAIN},
    };
  }

  return {shouldRedirect: false};
}
