/**
 * @file composables/chat/sidebar/useChatSidebarActions.js
 * @description AppSidebar에서 발생하는 새대화, Assistant 선택, 대화방 선택, 메뉴 action을 담당합니다.
 * Sidebar action은 router/store/runtime을 직접 사용하고, history dialog action만 기존 ChatContainer dialog provider로 위임합니다.
 */

import {nextTick} from "vue";
import {isPortalAssistantId} from "@/constants/assistantPortal";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {useAssistantStore} from "@/stores/assistantStore";
import {useChatStore} from "@/stores/chatStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {useChatRuntime} from "@/composables/chat/useChatRuntime";
import {navigateToConversation} from "@/composables/chat/internal/navigation/conversationUrlPolicy";
import {useChatActionsContext} from "@/composables/chat/context/useChatInject";
import {cleanupActiveConversationForNavigation} from "@/composables/chat/conversation/useActiveConversationCleanup";
import {
  clearConversationNavigationState as clearConversationNavigationStateByPolicy,
  navigateToMainAfterConversationReset,
  resetConversationStateForRouteChange as resetConversationStateForRouteChangeByPolicy,
  preparePortalConversationNavigation,
  cleanupAfterPortalConversationNavigation,
} from "@/composables/chat/internal/navigation/chatNavigationReset";
import {createPortalAssistantRoute} from "@/composables/chat/internal/navigation/portalAssistantRoutePolicy";
import {logWarn} from "@/utils/logger";

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
  const historyDialogActions = chatActions || useChatActionsContext();
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();
  const navigationStore = useNavigationStore();
  const runtime = useChatRuntime();
  const {
    NAVIGATION_LOCK_SCOPES,
    acquireLockIfFree,
    releaseLock,
    isGlobalLocked,
    isStreamingLocked,
  } = useNavigationLock();

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

  function createNavigationResetContext() {
    return {
      chatStore,
      releaseLock,
      chatHistoryScope: NAVIGATION_LOCK_SCOPES.chatHistory,
      clearActiveSession: runtime.clearActiveSession?.bind(runtime),
      cleanupActiveConversation: cleanupActiveConversationForNavigation,
      navigationStore,
      closeAssistantSelector,
    };
  }

  function clearConversationNavigationState() {
    clearConversationNavigationStateByPolicy(createNavigationResetContext());
  }

  function preparePortalNavigation() {
    preparePortalConversationNavigation(createNavigationResetContext());
  }

  function cleanupAfterPortalNavigation() {
    cleanupAfterPortalConversationNavigation(createNavigationResetContext());
  }

  async function navigatePortalAssistant(assistantId) {
    const targetRoute = createPortalAssistantRoute(assistantId);

    preparePortalNavigation();
    assistantStore.selectAssistant(assistantId);
    await router?.push(targetRoute).catch(() => {});
    cleanupAfterPortalNavigation();
  }

  async function navigateMainAfterReset() {
    await navigateToMainAfterConversationReset({
      router,
      clearBeforeNavigate: clearConversationNavigationState,
    });
  }

  function resetConversationStateForRouteChange() {
    resetConversationStateForRouteChangeByPolicy(
      createNavigationResetContext()
    );
  }

  async function resetChatState({assistantId = null} = {}) {
    resetConversationStateForRouteChange();

    if (assistantId) {
      try {
        await runtime.selectAssistant?.(assistantId, {forNewChat: true});
      } catch (error) {
        logWarn("[useChatSidebarActions] selectAssistant 오류:", error);
      }
    }

    await navigateMainAfterReset();
  }

  function openAssistantSelector() {
    if (isBlocked(lock?.isAssistantSelectBlocked)) return;
    if (typeof syncViewportMode === "function") syncViewportMode();
    if (assistantMenuOpen) assistantMenuOpen.value = !assistantMenuOpen.value;
  }

  async function selectAssistant(id) {
    if (isPortalAssistantId(id)) {
      if (isGlobalLocked.value || isStreamingLocked.value) return false;
      await navigatePortalAssistant(id);
      return true;
    }

    if (isBlocked(lock?.isAssistantSelectBlocked)) return false;

    await resetChatState({assistantId: id});

    if (
      [ROUTE_NAMES.STUDIO, ROUTE_NAMES.CONNECTOR_STORE].includes(route?.name)
    ) {
      await router?.push({name: ROUTE_NAMES.MAIN}).catch(() => {});
    }

    return true;
  }

  async function newChat() {
    if (isBlocked(lock?.isNewChatBlocked)) return false;
    await resetChatState();
    return true;
  }

  function openChatSearch() {
    if (isBlocked(lock?.isChatSearchBlocked)) return false;
    closeSidebarNavigationPanels();
    router?.push({name: ROUTE_NAMES.CHAT_SEARCH}).catch(() => {});
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
      chatStore.setPendingSelectedChatId(historyId);
      navigationStore.closeTransientPanels();
      navigationStore.setDrawerOpen(false);
      navigationStore.setCollapsedRecentOpen(false);

      await navigateToConversation({
        router,
        chatStore,
        chatId: historyId,
      }).catch(() => {});

      if (options.closeCollapsedRecent) {
        navigationStore.setCollapsedRecentOpen(false);
      } else {
        navigationStore.setDrawerOpen(false);
      }

      await nextTick();
      return true;
    } catch (_error) {
      releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory, historyId);
      chatStore.clearPendingSelectedChatId();
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
    historyDialogActions?.historyMenuAction?.({action, history});
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
