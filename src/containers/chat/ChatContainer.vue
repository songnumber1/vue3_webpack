<template>
  <ChatLayout
    v-if="shellReady"
    :keyboard-open="layoutKeyboardOpen"
    :mode="routeMode"
  >
    <HomeWorkspace
      v-if="activeWorkspaceType === 'main'"
      :ref="setWorkspaceRef"
      @prompt-submit="handleWorkspaceSubmit"
      @update-selected-model="handleWorkspaceSelectedModelUpdate"
      @prompt-focus="refreshPromptViewport"
      @prompt-height-change="refreshPromptViewport"
    />

    <ChatConversationWorkspace
      v-else-if="activeWorkspaceType === 'conversation'"
      :ref="setWorkspaceRef"
    />

    <StudioWorkspace
      v-else-if="activeWorkspaceType === 'studio'"
      :ref="setWorkspaceRef"
    />

    <McpWorkspace
      v-else-if="activeWorkspaceType === 'mcp'"
      :ref="setWorkspaceRef"
    />

    <ChatSearchWorkspace
      v-else-if="activeWorkspaceType === 'chat-search'"
      :ref="setWorkspaceRef"
    />

    <!-- 이미지 크게 보기 -->
    <ChatImagePreview
      :image="previewImage"
      @close="closeImagePreview"
      @load="handlePreviewLoad"
      @error="handlePreviewError"
    />

    <AssistantBottomSheet
      :open="assistantSheetOpen"
      :assistants="visibleAssistants"
      :selected-assistant-id="selectedAssistantId"
      @close="assistantSheetOpen = false"
      @select="handleAssistantNewChat"
    />

    <ResponseOverlayHost @applied="handleRuntimeOverlayApplied" />

    <StudioDetailViewer
      :open="studioDetailOpen"
      :studio="studioDetailStudio"
      :is-mobile="isMobile"
      :allow-actions="true"
      :actions-disabled="isStudioDetailBlocked"
    />

    <ChatHistoryConfirmDialog
      :open="historyDialogOpen"
      :mode="historyDialogMode"
      :title="historyDialogTitle"
      :message="historyDialogMessage"
      :initial-title="historyDialogTarget?.title || ''"
      :share-url="historyDialogShareUrl"
      @cancel="closeHistoryDialog"
      @confirm="confirmHistoryDialog"
    />

  </ChatLayout>

  <div v-else class="chat-bootstrap-loading" aria-live="polite">
    <span class="chat-bootstrap-loading__dot"></span>
  </div>
</template>

<script setup>
/**
 * @file containers/chat/ChatContainer.vue
 * @description 채팅 화면의 최상위 조립 계층입니다. 주요 상태와 action을 직접 import로 하위 Vue 컴포넌트에 연결합니다.
 */

import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import {useEventListener} from "@vueuse/core";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {isPortalAssistantId} from "@/constants/assistantPortal";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import AssistantBottomSheet from "@/components/assistant/select/AssistantBottomSheet.vue";
import ChatImagePreview from "@/components/chat/ChatImagePreview.vue";
import ChatLayout from "@/components/chat/ChatLayout.vue";
import ResponseOverlayHost from "@/components/overlay/ResponseOverlayHost.vue";
import ChatHistoryConfirmDialog from "@/components/navigation/history/ChatHistoryConfirmDialog.vue";
import StudioDetailViewer from "@/components/studio/StudioDetailViewer.vue";
import HomeWorkspace from "@/components/workspace/HomeWorkspace.vue";
import ChatConversationWorkspace from "@/components/workspace/ChatConversationWorkspace.vue";
import StudioWorkspace from "@/components/workspace/StudioWorkspace.vue";
import McpWorkspace from "@/components/workspace/McpWorkspace.vue";
import ChatSearchWorkspace from "@/components/search/ChatSearchWorkspace.vue";
import {useChatStore} from "@/stores/chatStore";
import {useAppBootstrap} from "@/composables/app/useAppBootstrap";
import {logWarn} from "@/utils/logger";
import {
  deleteChatHistory,
  loadChatHistoryList,
  loadExamplePrompts,
  renameChatHistory,
  updateChatBookmark,
} from "@/composables/chat/runtime/chatRuntimeApi";
import {notifyChatHistorySyncFailed} from "@/utils/chatHistoryErrorNotifier";
import {
  revokeMessageAttachments,
} from "@/composables/chat/chatMessageActions";
import {markSessionAsMissingAssistant} from "@/composables/chat/internal/policy/chatSessionPolicy";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAppShellStore} from "@/stores/appShellStore";
import {useImagePreview} from "@/composables/chat/useImagePreview";
import {useViewportGuard} from "@/platform/viewport/useViewportGuard";
import {syncMobileViewportSettings} from "@/utils/syncMobileViewportSettings";
import {
  configureResponseOverlay,
  setupResponseOverlayBackGuard,
} from "@/composables/overlay/responseOverlayActions";
import {useOverlayBackClose} from "@/composables/overlay/useOverlayBackClose";

import {
  cleanupAfterPortalConversationNavigation,
  clearConversationNavigationState as clearConversationNavigationStateByPolicy,
  createPortalAssistantRoute,
  getPortalAssistantIdByRouteName,
  navigateToMainAfterConversationReset,
  preparePortalConversationNavigation,
  resolveActiveChatId,
} from "@/composables/chat/chatRoomActions";
import {resolveRouteMode} from "@/constants/routeNames";
import {deleteStudio} from "@/services/studioDetailService";
import {
  isStudioAssistant,
  normalizeStudioDetail,
} from "@/composables/studio/useStudioDetailModel";
import {resolveBooleanSource} from "@/utils/interactionGuard";

import {provideNavigationActions} from "@/composables/navigation/context/navigationActionContext";
import {provideStudioDetailActions} from "@/composables/studio/context/studioDetailActionContext";

/**
 * [ChatContainer 연결 구조]
 * 이 파일은 route/page 상태와 주요 UI/data 흐름을 직접 연결합니다.
 * 채팅 질의/답변 실행은 ChatHistory가 담당하고, 이 파일은 workspace 전환과 공통 UI 상태만 관리합니다.
 */

const WORKSPACE_TYPES = Object.freeze({
  MAIN: "main",
  CONVERSATION: "conversation",
  STUDIO: "studio",
  MCP: "mcp",
  CHAT_SEARCH: "chat-search",
});

const props = defineProps({
  workspace: {type: String, default: ""},
});


const route = useRoute();
const router = useRouter();
const appRuntimeStore = useAppRuntimeStore();
const chatStore = useChatStore();
const studioRuntimeStore = useStudioRuntimeStore();
const appBootstrap = useAppBootstrap();
const {
  assistants: assistantListRef,
  selectedAssistantId: selectedAssistantIdRef,
  selectedModelId: selectedModelIdRef,
} = storeToRefs(chatStore);
const {histories: historyListRef} = storeToRefs(chatStore);

// 템플릿에서는 기존 prop 이름을 그대로 사용하므로 ref alias를 명시합니다.
const selectedAssistantId = selectedAssistantIdRef;

function getRuntimeAssistantList() {
  return Array.isArray(chatStore.assistants)
    ? chatStore.assistants
    : [];
}

function getRuntimeAssistantCount() {
  return getRuntimeAssistantList().length;
}
async function refreshHistories({notifyOnError = false} = {}) {
  try {
    const chatHistories = await loadChatHistoryList({
      assistantMap: chatStore.assistantMap,
      modelMap: chatStore.modelMap,
    });
    chatStore.setHistories(chatHistories);
    return chatHistories;
  } catch (error) {
    logWarn("[ChatContainer] refreshHistories 오류:", error);
    if (notifyOnError) await notifyChatHistorySyncFailed(error);
    return chatStore.histories;
  }
}

function syncHistoriesInBackground(options = {}) {
  return Promise.resolve()
    .then(() => refreshHistories(options))
    .catch((error) => {
      logWarn("[ChatContainer] syncHistoriesInBackground 오류:", error);
      return chatStore.histories;
    });
}

async function toggleHistoryBookmark(history) {
  if (!history?.chatId) return;
  try {
    syncHistoriesInBackground({notifyOnError: true});
    await updateChatBookmark({
      chatId: history.chatId,
      bookmarkYN: !history.isPinned,
    });
    syncHistoriesInBackground({notifyOnError: true});
  } catch (error) {
    logWarn("[ChatContainer] toggleHistoryBookmark 오류:", error);
    throw error;
  }
}

async function renameHistory(history, title) {
  const chatTitle = String(title || "").trim();
  if (!history?.chatId || !chatTitle) return;
  try {
    syncHistoriesInBackground({notifyOnError: true});
    await renameChatHistory({chatId: history.chatId, chatTitle});
    syncHistoriesInBackground({notifyOnError: true});
  } catch (error) {
    logWarn("[ChatContainer] renameHistory 오류:", error);
    throw error;
  }
}

async function removeHistory(history) {
  if (!history?.chatId) return;
  try {
    syncHistoriesInBackground({notifyOnError: true});
    await deleteChatHistory({chatId: history.chatId});
    if (String(chatStore.selectedChatId) === String(history.chatId)) {
      chatStore.clearActiveSession();
    }
    syncHistoriesInBackground({notifyOnError: true});
  } catch (error) {
    logWarn("[ChatContainer] removeHistory 오류:", error);
    throw error;
  }
}
const routeMode = computed(() => resolveRouteMode(route.name));
const currentMode = computed(() => routeMode.value);
const pageState = {
  currentMode,
  isMainPage: computed(() => currentMode.value === "main"),
  isChatPage: computed(() => currentMode.value === "chat"),
  isSharedPage: computed(() => currentMode.value === "shared"),
  isConversationPage: computed(
    () => currentMode.value === "chat" || currentMode.value === "shared"
  ),
  isReadOnly: computed(() => currentMode.value === "shared"),
};

const activeWorkspaceType = computed(() => {
  const requestedWorkspace = String(props.workspace || "").trim();
  if (requestedWorkspace) return requestedWorkspace;

  if (pageState.isConversationPage.value) return WORKSPACE_TYPES.CONVERSATION;
  if (route.name === ROUTE_NAMES.CHAT_SEARCH)
    return WORKSPACE_TYPES.CHAT_SEARCH;
  if (route.name === ROUTE_NAMES.CONNECTOR_STORE) return WORKSPACE_TYPES.MCP;
  if (route.name === ROUTE_NAMES.STUDIO) return WORKSPACE_TYPES.STUDIO;
  return WORKSPACE_TYPES.MAIN;
});

const activeHistoryId = computed(() => {
  if (route.name === ROUTE_NAMES.SHARE_CHAT_ENTRY) {
    return String(route.params?.id || "").trim() || null;
  }

  if (pageState.isChatPage.value) {
    return resolveActiveChatId() || null;
  }
  if (pageState.isSharedPage.value) {
    return chatStore.activeRoomType === "shared"
      ? String(chatStore.activeRoomId || "").trim()
      : String(route.params?.id || route.params?.shareId || "").trim();
  }
  return null;
});
pageState.activeHistoryId = activeHistoryId;

const {t} = useI18n();
const {theme} = useAppContext();
syncMobileViewportSettings();

const runtimeCurrentAssistant = computed(
  () =>
    chatStore.currentAssistant ||
    assistantListRef.value[0] || {id: "", label: "Assistant", description: ""}
);
const runtimeIsActiveModelDeleted = computed(() =>
  Boolean(chatStore.activeSession?.isModelDeleted)
);
const runtimeIsActiveModelUnavailable = computed(() =>
  Boolean(chatStore.activeSession?.isModelUnavailable)
);
const runtimeIsModelLocked = computed(
  () => chatStore.isModelLocked || pageState.isConversationPage.value
);
const runtimeModels = computed(() => {
  const lockedModelId = chatStore.activeSession?.modelId;
  if (!runtimeIsModelLocked.value || !lockedModelId) {
    return chatStore.currentModels;
  }

  return [chatStore.modelMap[lockedModelId]].filter(Boolean);
});
const runtimeSelectedModel = computed({
  get: () => chatStore.activeSession?.modelId || selectedModelIdRef.value,
  set: (id) => {
    if (runtimeIsModelLocked.value) return;
    chatStore.selectModel(id);
  },
});
async function initializeRuntime() {
  await appBootstrap.ensureInitialized();
}

async function preloadRuntimeExamplePrompts(assistantId) {
  if (!assistantId || chatStore.examplePromptMap[assistantId]) return;
  try {
    const assistant = chatStore.assistantMap[assistantId];
    const prompts = await loadExamplePrompts(
      assistantId,
      assistant?.type === "studio"
    );
    chatStore.setExamplePrompts(assistantId, prompts);
  } catch (error) {
    logWarn("[ChatContainer] preloadExamplePrompts 오류:", error);
  }
}

async function selectRuntimeAssistant(id, {forNewChat = false} = {}) {
  if (!forNewChat && runtimeIsModelLocked.value) return;
  if (!chatStore.assistantMap[id]) return;
  try {
    await preloadRuntimeExamplePrompts(id);
    chatStore.selectAssistant(id);
    if (forNewChat) chatStore.clearActiveSession();
  } catch (error) {
    logWarn("[ChatContainer] selectAssistant 오류:", error);
  }
}

const runtime = {
  initialize: initializeRuntime,
  assistants: assistantListRef,
  currentAssistant: runtimeCurrentAssistant,
  histories: historyListRef,
  models: runtimeModels,
  selectedAssistantId: selectedAssistantIdRef,
  selectedModel: runtimeSelectedModel,
  isModelLocked: runtimeIsModelLocked,
  isActiveModelDeleted: runtimeIsActiveModelDeleted,
  isActiveModelUnavailable: runtimeIsActiveModelUnavailable,
  refreshHistories,
  syncHistoriesInBackground,
  toggleHistoryBookmark,
  renameHistory,
  removeHistory,
  selectAssistant: selectRuntimeAssistant,
  clearActiveSession: chatStore.clearActiveSession.bind(chatStore),
  revokeMessageAttachments,
};

const assistants = runtime.assistants;
const currentAssistant = runtime.currentAssistant;
const selectedModel = runtime.selectedModel;
const isActiveModelUnavailable = runtime.isActiveModelUnavailable;

const appShellStore = useAppShellStore();
appShellStore.setThemeName(theme.current);
const assistantSheetOpen = computed({
  get: () => appShellStore.assistantSheetOpen,
  set: (value) => {
    if (value) {
      appShellStore.openAssistantSheet();
    } else {
      appShellStore.closeAssistantSheet();
    }
  },
});
const {previewImage, closeImagePreview, handlePreviewLoad, handlePreviewError} =
  useImagePreview();

const isMobile = computed(() => true);

function updateMobileState() {
  // 모바일 전용 UI라 별도 갱신이 필요 없습니다.
}

configureResponseOverlay({
  isMobile,
  shouldSuppressChatRouteLoad: computed(() =>
    Boolean(pageState.isChatPage?.value)
  ),
  suppressChatRouteLoadId: activeHistoryId,
});
setupResponseOverlayBackGuard();

function cleanupScrollResources() {}

const {keyboardOpen, refreshViewport} = useViewportGuard({
  onChange: () => {},
});

const layoutKeyboardOpen = computed(
  () => !pageState.isMainPage.value && keyboardOpen.value
);

const historyDialogOpen = ref(false);
const historyDialogMode = ref("rename");
const historyDialogTarget = ref(null);

const historyDialogTitle = computed(() => {
  if (historyDialogMode.value === "delete") {
    return t("chat.historyDialog.deleteTitle");
  }

  if (historyDialogMode.value === "share") {
    return t("chat.historyDialog.shareTitle");
  }

  return t("chat.historyDialog.renameTitle");
});

function resolveHistoryShareChatId(history) {
  return String(
    history?.chatId ||
      history?.chatId ||
      history?.raw?.chatId ||
      history?.sharedId ||
      ""
  ).trim();
}

const historyDialogShareUrl = computed(() => {
  const chatId = resolveHistoryShareChatId(historyDialogTarget.value);
  if (!chatId || typeof window === "undefined") return "";

  const href = router.resolve({
    name: ROUTE_NAMES.SHARE_CHAT_ENTRY,
    params: {id: chatId},
  }).href;

  return new URL(href, window.location.origin).toString();
});

const historyDialogMessage = computed(() => {
  if (historyDialogMode.value === "delete") {
    return t("chat.historyDialog.deleteMessage", {
      title:
        historyDialogTarget.value?.title ||
        t("chat.historyDialog.selectedConversation"),
    });
  }

  if (historyDialogMode.value === "share") {
    return t("chat.historyDialog.shareMessage", {
      title:
        historyDialogTarget.value?.title ||
        t("chat.historyDialog.selectedConversation"),
    });
  }

  return "";
});

function closeHistoryDialog() {
  historyDialogOpen.value = false;
  historyDialogTarget.value = null;
}

async function confirmHistoryDialog(value) {
  if (chatStore.isWait) return;

  const target = historyDialogTarget.value;
  if (!target) {
    closeHistoryDialog();
    return;
  }

  try {
    if (historyDialogMode.value === "rename") {
      const nextTitle = String(value || "").trim();
      if (!nextTitle) return;
      await runtime.renameHistory(target, nextTitle);
      return;
    }

    if (historyDialogMode.value === "delete") {
      await runtime.removeHistory(target);

      if (String(activeHistoryId.value) === String(target.chatId)) {
        await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
      }
      return;
    }

    if (historyDialogMode.value === "share") {
      runtime.syncHistoriesInBackground?.({notifyOnError: true});
    }
  } catch (error) {
    logWarn("[ChatContainer] confirmHistoryDialog 오류:", error);
  } finally {
    closeHistoryDialog();
  }
}

async function handleHistoryMenuAction({action, history} = {}) {
  if (chatStore.isWait) return;
  if (!history || !action) return;

  runtime.syncHistoriesInBackground?.({notifyOnError: true});

  if (action === "pin" || action === "unpin") {
    try {
      await runtime.toggleHistoryBookmark(history);
    } catch (error) {
      logWarn("[ChatContainer] toggleHistoryBookmark 오류:", error);
    }
    return;
  }

  if (action === "rename") {
    historyDialogTarget.value = history;
    historyDialogMode.value = "rename";
    historyDialogOpen.value = true;
    return;
  }

  if (action === "share") {
    historyDialogTarget.value = history;
    historyDialogMode.value = "share";
    historyDialogOpen.value = true;
    return;
  }

  if (action === "delete") {
    historyDialogTarget.value = history;
    historyDialogMode.value = "delete";
    historyDialogOpen.value = true;
  }
}

function refreshPromptViewport() {
  if (pageState.isReadOnly.value || runtime.isActiveModelUnavailable.value) {
    return;
  }

  refreshViewport();
}

function clearConversationNavigationState() {
  clearConversationNavigationStateByPolicy();
  cleanupConversationForNavigation();
}

async function navigateToMainAfterReset() {
  await navigateToMainAfterConversationReset(
    router,
    clearConversationNavigationState
  );
}

async function resetChatState({assistantId = null} = {}) {
  if (chatStore.isWait) return;

  clearConversationNavigationState();

  if (assistantId) {
    try {
      await runtime.selectAssistant(assistantId, {forNewChat: true});
    } catch (error) {
      logWarn("[ChatContainer] selectAssistant 오류:", error);
    }
    assistantSheetOpen.value = false;
  }

  appShellStore.closeTransientShellPanels();
  await navigateToMainAfterReset();
}

const startNewChat = resetChatState;

function bindUiEvents() {
  useEventListener(window, "resize", updateMobileState, {passive: true});
}

function handleRuntimeOverlayApplied() {
  syncMobileViewportSettings();
  refreshViewport();
  updateMobileState();
  chatStore.requestScrollToBottom({behavior: "auto"});
}

function cleanupConversationForNavigation() {
}

function cleanupUiResources() {
  cleanupScrollResources();
}

const runtimeReady = ref(false);

const isGenerating = computed(() => chatStore.isWait);
const isReadOnly = computed(() => pageState.isReadOnly.value || chatStore.isActiveSharedRoom);
const isHistoryRendering = computed(() => chatStore.isHistoryRendering);

function cleanupHistoryRender() {
  chatStore.resetHistoryRenderState();
}


bindUiEvents();

onMounted(async () => {
  updateMobileState();
  try {
    await runtime.initialize();
  } catch (error) {
    logWarn("[ChatContainer] runtime.initialize 오류:", error);
  } finally {
    runtimeReady.value = true;
  }
});

onBeforeUnmount(() => {
  cleanupUiResources();
  cleanupHistoryRender();
});

const shellReady = computed(
  () => runtimeReady.value || appRuntimeStore.initialized
);

const isChatContainerHistoryBusy = computed(() =>
  resolveBooleanSource(isHistoryRendering)
);
const isConversationActionBlocked = computed(
  () => chatStore.isWait || isChatContainerHistoryBusy.value
);
const chatPageLock = {
  isConversationActionBlocked,
  isSubmitBlocked: computed(
    () =>
      isConversationActionBlocked.value ||
      chatStore.isWait ||
      resolveBooleanSource(isReadOnly) ||
      resolveBooleanSource(isGenerating) ||
      resolveBooleanSource(isActiveModelUnavailable)
  ),
  isRegenerateBlocked: computed(
    () =>
      isConversationActionBlocked.value ||
      resolveBooleanSource(isReadOnly) ||
      resolveBooleanSource(isGenerating)
  ),
};

const isStudioDetailBlocked = computed(
  () =>
    chatPageLock.isConversationActionBlocked.value ||
    isGenerating.value ||
    isHistoryRendering.value
);

const studioDetailStudio = ref(null);
const studioDetailOpen = computed(() => Boolean(studioDetailStudio.value));
useOverlayBackClose({
  isOpen: studioDetailOpen,
  close: closeStudioDetail,
  historyValue: "chat-studio-detail",
});

provideNavigationActions({
  handleHistoryMenuAction,
});


provideStudioDetailActions({
  open: openStudioDetail,
  close: closeStudioDetail,
  edit: handleStudioDetailEdit,
  delete: handleStudioDetailDelete,
});

function isDeletedRuntimeStudioAssistant(assistant = null) {
  const id = String(assistant?.id || "").trim();
  return Boolean(
    id && isStudioAssistant(assistant) && studioRuntimeStore.isStudioDeleted(id)
  );
}

const visibleAssistants = computed(() =>
  (assistants.value || []).filter(
    (assistant) => !isDeletedRuntimeStudioAssistant(assistant)
  )
);

function closeStudioDetail() {
  studioDetailStudio.value = null;
}

function openStudioDetail() {
  if (isStudioDetailBlocked.value) return;
  if (!isStudioAssistant(currentAssistant.value)) return;

  const studio = normalizeStudioDetail(currentAssistant.value, {
    modelLabel: selectedModel.value?.label,
  });
  if (!studio || studioRuntimeStore.isStudioDeleted(studio.id)) return;
  studioDetailStudio.value = studio;
}

function findFirstFallbackAssistant() {
  return getRuntimeAssistantList().find(
    (assistant) =>
      assistant?.id &&
      !isPortalAssistantId(assistant.id) &&
      !isDeletedRuntimeStudioAssistant(assistant) &&
      !isStudioAssistant(assistant) &&
      assistant.type !== "mcp" &&
      assistant.mcp !== true
  );
}

function createStudioEditRoute() {
  return {name: ROUTE_NAMES.STUDIO};
}

function handleStudioDetailEdit(studio) {
  if (!studio || isStudioDetailBlocked.value) return;
  const normalized = normalizeStudioDetail(studio) || studio;
  if (!normalized?.id) return;
  studioRuntimeStore.setPendingEditStudio(normalized);
  closeStudioDetail();
  router.push(createStudioEditRoute(normalized.id)).catch(() => {});
}

async function handleStudioDetailDelete(studio) {
  if (!studio || isStudioDetailBlocked.value) return;
  const normalized = normalizeStudioDetail(studio) || studio;
  const deletedStudioId = String(normalized?.id || "").trim();
  if (!deletedStudioId) return;

  await deleteStudio(deletedStudioId).catch(() => null);
  studioRuntimeStore.markStudioDeleted(deletedStudioId);
  closeStudioDetail();

  if (route.name === ROUTE_NAMES.MAIN) {
    const fallback = findFirstFallbackAssistant();
    if (fallback?.id) chatStore.selectAssistant(fallback.id);
    chatStore.clearActiveSession();
    return;
  }

  if (
    route.name === ROUTE_NAMES.CHAT_DETAIL ||
    route.name === ROUTE_NAMES.CHAT_ENTRY
  ) {
    const currentSession = chatStore.activeSession || {};
    const isCurrentDeletedStudio =
      String(currentSession.assistantId || "") === deletedStudioId ||
      String(currentAssistant.value?.id || "") === deletedStudioId;

    if (!isCurrentDeletedStudio) return;

    const deletedStudioLabel = String(
      currentSession.assistantLabel ||
        currentSession.displayAssistantLabel ||
        normalized.name ||
        normalized.label ||
        ""
    ).trim();

    chatStore.setActiveSession(
      markSessionAsMissingAssistant(
        {
          ...currentSession,
          chatId: currentSession.chatId || chatStore.selectedChatId,
        },
        deletedStudioId,
        deletedStudioLabel,
        "studio"
      )
    );
  }
}

function preparePortalNavigation() {
  preparePortalConversationNavigation();
}

function cleanupAfterPortalNavigation() {
  cleanupAfterPortalConversationNavigation();
}

async function openPortalAssistant(assistantId) {
  const targetRoute = createPortalAssistantRoute(assistantId);

  preparePortalNavigation();
  chatStore.selectAssistant(assistantId);
  assistantSheetOpen.value = false;
  await router.push(targetRoute).catch(() => {});
  cleanupAfterPortalNavigation();
}

async function handleAssistantNewChat(assistantId) {
  if (isPortalAssistantId(assistantId)) {
    await openPortalAssistant(assistantId);
    return;
  }
  await startNewChat({assistantId});
}

function findFirstNormalAssistant() {
  return getRuntimeAssistantList().find(
    (assistant) =>
      assistant?.id &&
      !isPortalAssistantId(assistant.id) &&
      !isStudioAssistant(assistant) &&
      assistant.type !== "mcp" &&
      assistant.mcp !== true
  );
}

function syncAssistantSelectionWithRoute() {
  const routePortalAssistantId = getPortalAssistantIdByRouteName(route.name);

  if (routePortalAssistantId) {
    const portalAssistant = chatStore.assistantMap[routePortalAssistantId];
    if (
      portalAssistant &&
      chatStore.selectedAssistantId !== routePortalAssistantId
    ) {
      chatStore.selectAssistant(routePortalAssistantId);
    }
    return;
  }

  if (isPortalAssistantId(chatStore.selectedAssistantId)) {
    const fallbackAssistant = findFirstNormalAssistant();
    if (fallbackAssistant) chatStore.selectAssistant(fallbackAssistant.id);
  }
}

watch(
  [() => route.name, getRuntimeAssistantCount],
  syncAssistantSelectionWithRoute,
  {immediate: true}
);

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function setWorkspaceRef() {}


function handleWorkspaceSubmit(payload) {
  if (chatPageLock.isSubmitBlocked.value) return;
  if (route.name !== ROUTE_NAMES.MAIN) return;
  chatStore.setInput(payload);
  router.push({name: ROUTE_NAMES.CHAT_ENTRY}).catch(() => {
    chatStore.clearInput();
  });
}

function handleWorkspaceSelectedModelUpdate(value) {
  selectedModel.value = value;
}
</script>

<style scoped lang="scss">
.chat-container-root {
  min-width: 0;
  min-height: 0;
}
</style>
