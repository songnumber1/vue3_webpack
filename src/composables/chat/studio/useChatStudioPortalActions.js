/**
 * @file composables/chat/studio/useChatStudioPortalActions.js
 * @description ChatContainer에서 사용하던 Studio/MCP 포털 선택, Studio 상세/삭제, Assistant 선택 동기화 정책을 모읍니다.
 * UI/UX는 변경하지 않고 ChatContainer가 화면 조립 역할에 집중하도록 action만 분리합니다.
 */

import {computed, ref, watch} from "vue";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {useAssistantStore} from "@/stores/assistantStore";
import {useChatStore} from "@/stores/chatStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {cleanupActiveConversationForNavigation} from "@/composables/chat/conversation/useActiveConversationCleanup";
import {
  cleanupAfterPortalConversationNavigation,
  preparePortalConversationNavigation,
} from "@/composables/chat/navigation/chatNavigationReset";
import {isHiddenConversationUrlMode} from "@/composables/chat/policy/chatRoutePolicy";
import {markSessionAsMissingAssistant} from "@/composables/chat/policy/chatSessionPolicy";
import {deleteStudio} from "@/services/studioDetailService";
import {
  isStudioAssistant,
  normalizeStudioDetail,
} from "@/composables/studio/useStudioDetailModel";

const ASSISTANT_STUDIO_PORTAL_ID = "assistant-studio";
const CONNECTOR_STORE_PORTAL_ID = "connector-store";
const PORTAL_ASSISTANT_IDS = [
  ASSISTANT_STUDIO_PORTAL_ID,
  CONNECTOR_STORE_PORTAL_ID,
];

function isPortalAssistantId(assistantId) {
  return PORTAL_ASSISTANT_IDS.includes(String(assistantId || ""));
}

export function useChatStudioPortalActions({
  route,
  router,
  assistants,
  currentAssistant,
  selectedModel,
  assistantSheetOpen,
  isStudioDetailBlocked,
  startNewChat,
} = {}) {
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();
  const navigationStore = useNavigationStore();
  const studioRuntimeStore = useStudioRuntimeStore();
  const systemSettingsStore = useSystemSettingsStore();
  const {NAVIGATION_LOCK_SCOPES, releaseLock} = useNavigationLock();

  const studioDetailStudio = ref(null);
  const studioDetailOpen = computed(() => Boolean(studioDetailStudio.value));

  function isDeletedRuntimeStudioAssistant(assistant = null) {
    const id = String(assistant?.id || "").trim();
    return Boolean(
      id &&
      isStudioAssistant(assistant) &&
      studioRuntimeStore.isStudioDeleted(id)
    );
  }

  const visibleAssistants = computed(() =>
    (assistants?.value || []).filter(
      (assistant) => !isDeletedRuntimeStudioAssistant(assistant)
    )
  );

  function closeStudioDetail() {
    studioDetailStudio.value = null;
  }

  function openStudioDetail() {
    if (isStudioDetailBlocked?.value) return;
    if (!isStudioAssistant(currentAssistant?.value)) return;
    const studio = normalizeStudioDetail(currentAssistant.value, {
      modelLabel: selectedModel?.value?.label,
    });
    if (!studio || studioRuntimeStore.isStudioDeleted(studio.id)) return;
    studioDetailStudio.value = studio;
  }

  function findFirstFallbackAssistant() {
    return assistantStore.assistants.find(
      (assistant) =>
        assistant?.id &&
        !isPortalAssistantId(assistant.id) &&
        !isDeletedRuntimeStudioAssistant(assistant) &&
        !isStudioAssistant(assistant) &&
        assistant.type !== "mcp" &&
        assistant.mcp !== true
    );
  }

  function createStudioEditRoute(studioId) {
    const routeConfig = {name: ROUTE_NAMES.STUDIO};
    if (!isHiddenConversationUrlMode(systemSettingsStore.settings)) {
      routeConfig.query = {mode: "edit", studioId};
    }
    return routeConfig;
  }

  function handleStudioDetailEdit(studio) {
    if (!studio || isStudioDetailBlocked?.value) return;
    const normalized = normalizeStudioDetail(studio) || studio;
    if (!normalized?.id) return;
    studioRuntimeStore.setPendingEditStudio(normalized);
    closeStudioDetail();
    router?.push(createStudioEditRoute(normalized.id)).catch(() => {});
  }

  async function handleStudioDetailDelete(studio) {
    if (!studio || isStudioDetailBlocked?.value) return;
    const normalized = normalizeStudioDetail(studio) || studio;
    const deletedStudioId = String(normalized?.id || "").trim();
    if (!deletedStudioId) return;

    await deleteStudio(deletedStudioId).catch(() => null);
    studioRuntimeStore.markStudioDeleted(deletedStudioId);
    releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
    closeStudioDetail();

    if (route?.name === ROUTE_NAMES.MAIN) {
      const fallback = findFirstFallbackAssistant();
      if (fallback?.id) assistantStore.selectAssistant(fallback.id);
      chatStore.clearActiveSession();
      return;
    }

    if (
      route?.name === ROUTE_NAMES.CHAT_DETAIL ||
      route?.name === ROUTE_NAMES.CHAT_ENTRY
    ) {
      const currentSession = chatStore.activeSession || {};
      const isCurrentDeletedStudio =
        String(currentSession.assistantId || "") === deletedStudioId ||
        String(currentAssistant?.value?.id || "") === deletedStudioId;

      if (!isCurrentDeletedStudio) return;

      const deletedStudioLabel = String(
        currentSession.assistantLabel ||
          currentSession.displayAssistantLabel ||
          normalized.name ||
          normalized.label ||
          ""
      ).trim();

      chatStore.setActiveSession(
        markSessionAsMissingAssistant({
          session: {
            ...currentSession,
            chatId: currentSession.chatId || chatStore.selectedChatId,
          },
          assistantId: deletedStudioId,
          assistantLabel: deletedStudioLabel,
          assistantType: "studio",
        })
      );
    }
  }

  function createPortalNavigationResetContext() {
    return {
      chatStore,
      releaseLock,
      chatHistoryScope: NAVIGATION_LOCK_SCOPES.chatHistory,
      cleanupActiveConversation: cleanupActiveConversationForNavigation,
      navigationStore,
    };
  }

  function preparePortalNavigation() {
    preparePortalConversationNavigation(createPortalNavigationResetContext());
  }

  function cleanupAfterPortalNavigation() {
    cleanupAfterPortalConversationNavigation(
      createPortalNavigationResetContext()
    );
  }

  async function openPortalAssistant(assistantId) {
    const targetRoute = {
      name:
        assistantId === CONNECTOR_STORE_PORTAL_ID
          ? ROUTE_NAMES.CONNECTOR_STORE
          : ROUTE_NAMES.STUDIO,
    };

    preparePortalNavigation();
    assistantStore.selectAssistant(assistantId);
    if (assistantSheetOpen) assistantSheetOpen.value = false;
    await router?.push(targetRoute).catch(() => {});
    cleanupAfterPortalNavigation();
  }

  async function handleAssistantNewChat(assistantId) {
    if (isPortalAssistantId(assistantId)) {
      await openPortalAssistant(assistantId);
      return;
    }
    await startNewChat?.({assistantId});
  }

  function findFirstNormalAssistant() {
    return assistantStore.assistants.find(
      (assistant) =>
        assistant?.id &&
        !isPortalAssistantId(assistant.id) &&
        !isStudioAssistant(assistant) &&
        assistant.type !== "mcp" &&
        assistant.mcp !== true
    );
  }

  function syncAssistantSelectionWithRoute() {
    const studioAssistant =
      assistantStore.assistantMap[ASSISTANT_STUDIO_PORTAL_ID];
    const connectorAssistant =
      assistantStore.assistantMap[CONNECTOR_STORE_PORTAL_ID];

    if (route?.name === ROUTE_NAMES.STUDIO) {
      if (
        studioAssistant &&
        assistantStore.selectedAssistantId !== ASSISTANT_STUDIO_PORTAL_ID
      ) {
        assistantStore.selectAssistant(ASSISTANT_STUDIO_PORTAL_ID);
      }
      return;
    }

    if (route?.name === ROUTE_NAMES.CONNECTOR_STORE) {
      if (
        connectorAssistant &&
        assistantStore.selectedAssistantId !== CONNECTOR_STORE_PORTAL_ID
      ) {
        assistantStore.selectAssistant(CONNECTOR_STORE_PORTAL_ID);
      }
      return;
    }

    if (isPortalAssistantId(assistantStore.selectedAssistantId)) {
      const fallbackAssistant = findFirstNormalAssistant();
      if (fallbackAssistant)
        assistantStore.selectAssistant(fallbackAssistant.id);
    }
  }

  watch(
    [() => route?.name, () => assistantStore.assistants.length],
    syncAssistantSelectionWithRoute,
    {immediate: true}
  );

  return {
    visibleAssistants,
    studioDetailStudio,
    studioDetailOpen,
    closeStudioDetail,
    openStudioDetail,
    handleStudioDetailEdit,
    handleStudioDetailDelete,
    handleAssistantNewChat,
    isPortalAssistantId,
  };
}
