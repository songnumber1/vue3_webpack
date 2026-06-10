/**
 * @file composables/chat/sidebar/useChatSidebarActions.js
 * @description AppSidebar에서 발생하는 새대화, Assistant 선택, 대화방 선택, 메뉴 action을 담당합니다.
 * 1차 리팩토링에서는 기존 ChatContainer provider action을 안전하게 감싸며, 다음 단계에서 provider 의존을 축소합니다.
 */

import {inject, nextTick} from "vue";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {useAssistantStore} from "@/stores/assistantStore";
import {useChatStore} from "@/stores/chatStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {
  CHAT_ACTIONS_KEY,
  createEmptyChatActions,
} from "@/composables/chat/chatActionContext";

const ASSISTANT_STUDIO_PORTAL_ID = "assistant-studio";
const CONNECTOR_STORE_PORTAL_ID = "connector-store";
const CONNECTOR_STORE_ROUTE_NAME = "connector-store";

function getHistoryId(item) {
  return String(item?.id || "").trim();
}

export function useChatSidebarActions({
  router,
  route,
  chatActions,
  lock,
  assistantMenuOpen,
  syncViewportMode,
  closeHistoryMenu,
} = {}) {
  const injectedChatActions =
    chatActions || inject(CHAT_ACTIONS_KEY, createEmptyChatActions());
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();
  const navigationStore = useNavigationStore();
  const {NAVIGATION_LOCK_SCOPES, acquireLockIfFree, releaseLock} =
    useNavigationLock();

  function closeSidebarNavigationPanels() {
    navigationStore.setDrawerOpen(false);
    navigationStore.setCollapsedRecentOpen(false);
  }

  function closeAssistantSelector() {
    if (assistantMenuOpen) assistantMenuOpen.value = false;
  }

  function isBlocked(blockedRef) {
    return Boolean(blockedRef?.value);
  }

  function openAssistantSelector() {
    if (isBlocked(lock?.isAssistantSelectBlocked)) return;
    if (typeof syncViewportMode === "function") syncViewportMode();
    if (assistantMenuOpen) assistantMenuOpen.value = !assistantMenuOpen.value;
  }

  async function selectAssistant(id) {
    if (isBlocked(lock?.isAssistantSelectBlocked)) return false;

    const isStudioPortal = id === ASSISTANT_STUDIO_PORTAL_ID;
    const isConnectorPortal = id === CONNECTOR_STORE_PORTAL_ID;

    if (isStudioPortal || isConnectorPortal) {
      assistantStore.selectAssistant(id);
      closeAssistantSelector();
      navigationStore.setDrawerOpen(false);
      await router
        ?.push({
          name: isConnectorPortal ? CONNECTOR_STORE_ROUTE_NAME : "studio",
        })
        .catch(() => {});
      return true;
    }

    const selected = await injectedChatActions?.selectAssistant?.(id);
    closeAssistantSelector();

    if (["studio", CONNECTOR_STORE_ROUTE_NAME].includes(route?.name)) {
      await router?.push({name: ROUTE_NAMES.MAIN}).catch(() => {});
    }

    return selected !== false;
  }

  async function newChat() {
    if (isBlocked(lock?.isNewChatBlocked)) return false;
    const moved = await injectedChatActions?.newChat?.();
    closeSidebarNavigationPanels();
    return moved !== false;
  }

  function openChatSearch() {
    if (isBlocked(lock?.isChatSearchBlocked)) return false;
    closeSidebarNavigationPanels();
    router?.push({name: "chat-search"}).catch(() => {});
    return true;
  }

  async function selectHistory(item, options = {}) {
    if (isBlocked(lock?.isHistorySelectBlocked)) return false;

    const historyId = getHistoryId(item);
    if (!historyId) return false;

    const currentHistoryId = String(
      chatStore.pendingSelectedChatId ||
        chatStore.activeRoomId ||
        chatStore.selectedChatId ||
        ""
    ).trim();
    if (currentHistoryId && currentHistoryId === historyId) {
      return false;
    }

    const lockEntry = acquireLockIfFree(NAVIGATION_LOCK_SCOPES.chatHistory, {
      owner: historyId,
      reason: "sidebar-history-select",
      meta: {source: options.source || "sidebar"},
    });

    if (!lockEntry) return false;

    try {
      const moved = await injectedChatActions?.selectHistory?.(item);
      if (moved === false) {
        releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory, historyId);
        return false;
      }

      if (options.closeCollapsedRecent) {
        navigationStore.setCollapsedRecentOpen(false);
      } else {
        navigationStore.setDrawerOpen(false);
      }

      await nextTick();
      return true;
    } catch (_error) {
      releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory, historyId);
      return false;
    }
  }

  function openHistoryMenu(payload = {}) {
    if (isBlocked(lock?.isHistoryMenuBlocked)) return false;
    if (typeof syncViewportMode === "function") syncViewportMode();
    return payload;
  }

  function historyMenuAction({action, history}) {
    if (isBlocked(lock?.isHistoryMenuBlocked)) return false;
    if (typeof closeHistoryMenu === "function") closeHistoryMenu();
    if (!history || !action) return false;
    injectedChatActions?.historyMenuAction?.({action, history});
    return true;
  }

  return {
    openAssistantSelector,
    selectAssistant,
    newChat,
    openChatSearch,
    selectHistory,
    openHistoryMenu,
    historyMenuAction,
  };
}
