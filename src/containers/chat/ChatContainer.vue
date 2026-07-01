<template>
  <ChatLayout
    v-if="shellReady"
    :keyboard-open="layoutKeyboardOpen"
    :mode="routeMode"
    @history-menu-action="handleHistoryMenuAction"
  >
    <HomeWorkspace
      v-if="activeWorkspaceType === 'main'"
      :ref="setWorkspaceRef"
      @open-studio-detail="openStudioDetail"
      @prompt-viewport-refresh="refreshPromptViewport"
    />

    <ChatConversationWorkspace
      v-else-if="activeWorkspaceType === 'conversation'"
      :ref="setWorkspaceRef"
      :mode="routeMode"
      :readonly="isReadOnly"
      :assistant-label="workspaceAssistantLabel"
      :assistant="currentAssistant"
      :conversation-title="activeConversationTitle"
      :theme-name="themeName"
      :is-active-model-deleted="Boolean(chatStore.activeSession?.isModelDeleted)"
      :is-active-model-unavailable="isActiveModelUnavailable"
      :is-generating="isGenerating"
      :messages="messages"
      :show-scroll-bottom="showScrollBottom"
      :is-history-rendering="isHistoryRendering"
      :history-markdown-visible="historyMarkdownVisible"
      :history-messages-loaded="historyMessagesLoaded"
      :history-render-key="activeHistoryId || ''"
      :message-render-policy="messageRenderPolicy"
      @open-studio-detail="openStudioDetail"
      @scroll-bottom="handleWorkspaceScrollBottom"
      @prompt-viewport-refresh="refreshPromptViewport"
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
  nextTick,
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
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useAppBootstrap} from "@/composables/app/useAppBootstrap";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {warmupMermaidForHistoryRender} from "@/utils/mermaidRenderer";
import {adaptChatHistoryItem as adaptChatHistory} from "@/adapters/chatResponseAdapter";
import {
  createChatHistory,
  deleteChatHistory,
  loadChatHistoryList,
  loadChatMessageRouters,
  loadExamplePrompts,
  renameChatHistory,
  updateChatBookmark,
} from "@/composables/chat/runtime/chatRuntimeApi";
import {notifyChatHistorySyncFailed} from "@/utils/chatHistoryErrorNotifier";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAppShellStore} from "@/stores/appShellStore";
import {useImagePreview} from "@/composables/chat/useImagePreview";
import {useViewportGuard} from "@/platform/viewport/useViewportGuard";
import {syncMobileViewportSettings} from "@/utils/syncMobileViewportSettings";
import {isProgressAllowedForCurrentPlatform} from "@/constants/chatRuntimePolicy";
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
  hasPendingChatNavigation,
  navigateToMainAfterConversationReset,
  preparePortalConversationNavigation,
  resolveActiveChatId,
  resolveHiddenConversationRoute,
} from "@/composables/chat/chatRoomActions";
import {resolveRouteMode} from "@/constants/routeNames";
import {deleteStudio} from "@/services/studioDetailService";
import {registerActiveConversationCleanup} from "@/composables/chat/conversation/activeConversationCleanupRegistry";
import {
  isStudioAssistant,
  normalizeStudioDetail,
} from "@/composables/studio/useStudioDetailModel";
import {resolveBooleanSource} from "@/utils/interactionGuard";

import {
  appendUserAndAssistantMessages as appendMessagesToChat,
  configureChatSubmit,
  regenerateLastAnswer,
  revokeMessageAttachments,
} from "@/composables/chat/useChatQuestionAnswer";
import {provideMessageActions} from "@/composables/chat/context/messageActionContext";
import {provideStudioDetailActions} from "@/composables/studio/context/studioDetailActionContext";
import {MESSAGE_SCROLL_TARGET_TYPES} from "@/composables/chat/internal/message-list/messageRenderPolicyTypes";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {useOverlayStore} from "@/stores/overlayStore";
import {getSharedConversation} from "@/composables/chat/useSharedChat";

/**
 * [ChatContainer 연결 구조]
 * 이 파일은 ChatContainer에서 route/page 상태와 주요 UI/data 흐름을 직접 연결합니다.
 * Header/Workspace/Prompt/ImagePreview/Sheet는 서로 직접 import하지 않고 provide/inject 또는 props/event로 연결됩니다.
 * 따라서 문제 추적 시 ChatContainer에서 직접 import한 store/function 흐름을 우선 확인합니다.
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

const LIST_READY_SCROLL_MAX_FRAMES = 60;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeId(value) {
  return normalizeText(value);
}

function normalizeNullableMessageId(value) {
  const id = normalizeId(value);
  return id || null;
}

function normalizeHistoryId(value) {
  return normalizeId(value);
}

function hasSharedId(chat) {
  return String(chat?.sharedId || "").trim().length > 0;
}

function isSharedChat(chat) {
  return hasSharedId(chat);
}

function resolveMessageRenderPolicy(
  selectedChat = null,
  searchTargetMessageId = null
) {
  const targetMessageId = normalizeNullableMessageId(searchTargetMessageId);

  if (targetMessageId) {
    return {
      scrollTarget: {
        type: MESSAGE_SCROLL_TARGET_TYPES.message,
        messageId: targetMessageId,
      },
    };
  }

  if (isSharedChat(selectedChat)) {
    return {scrollTarget: {type: MESSAGE_SCROLL_TARGET_TYPES.first}};
  }

  return {scrollTarget: {type: MESSAGE_SCROLL_TARGET_TYPES.bottom}};
}


function waitForNextPaint() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

const route = useRoute();
const router = useRouter();
const appRuntimeStore = useAppRuntimeStore();
const chatStore = useChatStore();
const chatStreamStore = useChatStreamStore();
const apiRequestStore = useApiRequestStore();
const studioRuntimeStore = useStudioRuntimeStore();
const appBootstrap = useAppBootstrap();
const {
  assistants: assistantListRef,
  selectedAssistantId: selectedAssistantIdRef,
  selectedModelId: selectedModelIdRef,
  examplePromptMap,
} = storeToRefs(chatStore);
const {histories: historyListRef} = storeToRefs(chatStore);

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
  if (!history?.id) return;
  try {
    syncHistoriesInBackground({notifyOnError: true});
    await updateChatBookmark({
      chatId: history.id,
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
  if (!history?.id || !chatTitle) return;
  try {
    syncHistoriesInBackground({notifyOnError: true});
    await renameChatHistory({chatId: history.id, chatTitle});
    syncHistoriesInBackground({notifyOnError: true});
  } catch (error) {
    logWarn("[ChatContainer] renameHistory 오류:", error);
    throw error;
  }
}

async function removeHistory(history) {
  if (!history?.id) return;
  try {
    syncHistoriesInBackground({notifyOnError: true});
    await deleteChatHistory({chatId: history.id});
    delete chatStore.messageMap[history.id];

    if (String(chatStore.selectedChatId) === String(history.id)) {
      chatStore.clearActiveSession();
    }
    syncHistoriesInBackground({notifyOnError: true});
  } catch (error) {
    logWarn("[ChatContainer] removeHistory 오류:", error);
    throw error;
  }
}
const routeMode = computed(() => resolveRouteMode(route.name));
const conversationMessages = ref([]);

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
    return (
      resolveActiveChatId() ||
      String(chatStore.pendingSelectedChatId || "").trim() ||
      null
    );
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
const runtimeCurrentExamplePrompts = computed(
  () => examplePromptMap.value[selectedAssistantIdRef.value] || []
);
const runtimeActiveSession = computed(() => chatStore.activeSession);
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
const runtimeConversations = computed(() => chatStore.messageMap);

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

function shouldPreserveSidebarAssistantOnHistoryOpen() {
  return false;
}

function resolveConversationTitle(
  isSharedPage = false,
  activeHistoryId = "",
  activeHistory = null,
  translate = null
) {
  if (isSharedPage) {
    if (typeof translate === "function") {
      return translate("chat.sharedConversationTitle", {
        id: activeHistoryId || "",
      }).trim();
    }
    return normalizeText(activeHistoryId);
  }

  return normalizeText(activeHistory?.title);
}

function resolveWorkspaceAssistantLabel(
  activeSession = null,
  currentAssistant = null,
  fallbackLabel = "Assistant"
) {
  const displayAssistantLabel = normalizeText(
    activeSession?.displayAssistantLabel
  );
  if (displayAssistantLabel) return displayAssistantLabel;

  const sessionAssistantLabel = normalizeText(activeSession?.assistantLabel);
  if (sessionAssistantLabel && !activeSession?.isModelUnavailable) {
    return sessionAssistantLabel;
  }

  return normalizeText(currentAssistant?.label) || fallbackLabel;
}


function firstNonEmptyText(...values) {
  return values.map(normalizeText).find(Boolean) || "";
}

function resolveHistoryAssistantLabel(history = {}, session = {}) {
  const raw = history.raw || {};
  return firstNonEmptyText(
    session.assistantLabel,
    history.assistantLabel,
    raw.assistantLabel,
    raw.assistName,
    raw.assistNm,
    raw.assistantName
  );
}

function isStudioConversationSession(history = {}, session = {}, assistant = null) {
  return Boolean(
    session?.assistantType === "studio" ||
      history?.assistantType === "studio" ||
      assistant?.type === "studio" ||
      assistant?.isStudio === true ||
      assistant?.studio === true
  );
}

function resolveDeletedStudioSessionState(
  history = {},
  session = {},
  assistantMap = {},
  studioRuntimeStore = null
) {
  const assistantId = normalizeId(session?.assistantId || history?.assistantId);
  const assistant = assistantMap?.[assistantId] || null;
  const isStudioSession = isStudioConversationSession(
    history,
    session,
    assistant
  );
  const isDeleted = Boolean(
    isStudioSession &&
      assistantId &&
      studioRuntimeStore?.isStudioDeleted?.(assistantId)
  );

  return {
    assistantId,
    isStudioSession,
    isDeleted,
    displayLabel: isDeleted
      ? resolveHistoryAssistantLabel(history, session)
      : "",
  };
}

function markSessionAsMissingAssistant(
  session = {},
  assistantId = "",
  assistantLabel = "",
  assistantType = "studio"
) {
  const deletedAssistantId = normalizeId(assistantId || session?.assistantId);
  const deletedAssistantLabel = firstNonEmptyText(
    session?.displayAssistantLabel,
    session?.assistantLabel,
    assistantLabel
  );

  return {
    ...session,
    chatId: session?.chatId || "",
    assistantId: session?.assistantId || deletedAssistantId,
    assistantType: session?.assistantType || assistantType,
    assistantLabel: session?.assistantLabel || deletedAssistantLabel,
    displayAssistantId: session?.displayAssistantId || deletedAssistantId,
    displayAssistantLabel:
      session?.displayAssistantLabel || deletedAssistantLabel,
    isAssistantMissing: true,
    isModelUnavailable: true,
    modelUnavailableReason: "missing-assistant",
  };
}

function resolveConversationSessionState(
  history = {},
  session = null,
  assistantMap = {},
  assistants = [],
  studioRuntimeStore = null,
  preserveSidebarAssistant = false
) {
  if (!session) {
    return {
      session: null,
      displayAssistant: null,
      shouldUseFallbackAssistant: false,
      isRuntimeDeletedStudioSession: false,
      deletedStudioAssistantLabel: "",
      nextSelectedAssistantId: "",
    };
  }

  const nextSession = {...session};
  const deletedStudio = resolveDeletedStudioSessionState(
    history,
    nextSession,
    assistantMap,
    studioRuntimeStore
  );

  if (deletedStudio.isDeleted) {
    Object.assign(
      nextSession,
      markSessionAsMissingAssistant(
        nextSession,
        deletedStudio.assistantId,
        deletedStudio.displayLabel,
        "studio"
      )
    );
  }

  const fallbackAssistant = Array.isArray(assistants)
    ? assistants[0] || null
    : null;
  const shouldUseFallbackAssistant = Boolean(
    nextSession?.isModelDeleted ||
      nextSession?.isModelMissing ||
      nextSession?.isAssistantMissing ||
      deletedStudio.isDeleted ||
      !nextSession?.assistantId
  );
  const displayAssistant = shouldUseFallbackAssistant
    ? fallbackAssistant
    : assistantMap?.[nextSession.assistantId] || fallbackAssistant;

  if (deletedStudio.displayLabel) {
    nextSession.displayAssistantId = deletedStudio.assistantId;
    nextSession.displayAssistantLabel = deletedStudio.displayLabel;
  } else if (displayAssistant?.id) {
    nextSession.displayAssistantId = displayAssistant.id;
    nextSession.displayAssistantLabel = displayAssistant.label;
  }

  return {
    session: nextSession,
    displayAssistant,
    shouldUseFallbackAssistant,
    isRuntimeDeletedStudioSession: deletedStudio.isDeleted,
    deletedStudioAssistantLabel: deletedStudio.displayLabel,
    nextSelectedAssistantId:
      !preserveSidebarAssistant &&
      !deletedStudio.displayLabel &&
      displayAssistant?.id
        ? displayAssistant.id
        : "",
  };
}

function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
  if (!history) return null;

  const model = modelMap[history.modelId] || null;
  const assistant =
    assistantMap[history.assistantId || model?.assistId] || null;
  const modelMissing = Boolean(history.modelId && !model);
  const assistantMissing = Boolean(
    (history.assistantId || model?.assistId) && !assistant
  );
  const modelDeleted = Boolean(model?.isDeleted);
  const unavailableReason = modelDeleted
    ? "deleted"
    : modelMissing
      ? "missing-model"
      : assistantMissing
        ? "missing-assistant"
        : "";

  return {
    chatId: history.id,
    assistantId: assistant?.id || history.assistantId || model?.assistId || "",
    assistantType: assistant?.type || history.assistantType || "",
    assistantLabel: assistant?.label || history.assistantLabel || "",
    modelId: model?.id || history.modelId || "",
    modelName: model?.label || history.modelLabel || "",
    modelType: model?.type || "",
    isModelDeleted: modelDeleted,
    isModelMissing: modelMissing,
    isAssistantMissing: assistantMissing,
    isModelUnavailable: Boolean(unavailableReason),
    modelUnavailableReason: unavailableReason,
    displayAssistantId: "",
    displayAssistantLabel: "",
    readonlyModel: true,
  };
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

async function ensureRuntimeConversation(historyId, options = {}) {
  const history = chatStore.getHistory(historyId);
  if (!history) return [];

  const session = createSessionFromHistory(
    history,
    chatStore.modelMap,
    chatStore.assistantMap
  );
  const sessionState = resolveConversationSessionState(
    history,
    session,
    chatStore.assistantMap,
    getRuntimeAssistantList(),
    studioRuntimeStore,
    shouldPreserveSidebarAssistantOnHistoryOpen()
  );
  const resolvedSession = sessionState.session || session;

  if (sessionState.nextSelectedAssistantId) {
    chatStore.selectAssistant(sessionState.nextSelectedAssistantId);
  }

  chatStore.setActiveSession(resolvedSession);

  if (!chatStore.messageMap[history.id]) {
    const messages = await loadChatMessageRouters(
      {
        chatId: history.id,
        assistId: resolvedSession?.assistantId || history.assistantId,
        modelId: resolvedSession?.modelId || history.modelId,
        studio: resolvedSession?.assistantType === "studio",
      },
      options
    );
    chatStore.setMessages(history.id, messages);
  }

  return chatStore.messageMap[history.id] || [];
}

async function createRemoteRuntimeConversation({
  text,
  assistantId,
  modelId,
} = {}) {
  const chatId = createId();
  const chatTitle = String(text || "")
    .trim()
    .slice(0, 20);
  const assistant = chatStore.assistantMap?.[assistantId] || null;
  const rawHistory = await createChatHistory({
    chatId,
    assistId: assistantId,
    modelId,
    ChatTilte: chatTitle || String(text || "").trim(),
    studio: assistant?.type === "studio",
  });
  const history = adaptChatHistory(rawHistory, {
    assistantMap: chatStore.assistantMap,
    modelMap: chatStore.modelMap,
  });

  if (!history?.id) {
    throw new Error("new.do response does not contain chatId.");
  }

  chatStore.addHistory(history);
  chatStore.setMessages(history.id, []);
  chatStore.setActiveSession(
    createSessionFromHistory(
      history,
      chatStore.modelMap,
      chatStore.assistantMap
    )
  );

  return history;
}


function appendRuntimeUserAndAssistantMessages(chatId, normalized) {
  return appendMessagesToChat(chatId, normalized);
}


const runtime = {
  initialize: initializeRuntime,
  assistants: assistantListRef,
  currentAssistant: runtimeCurrentAssistant,
  currentExamplePrompts: runtimeCurrentExamplePrompts,
  histories: historyListRef,
  models: runtimeModels,
  activeSession: runtimeActiveSession,
  selectedAssistantId: selectedAssistantIdRef,
  selectedModel: runtimeSelectedModel,
  isModelLocked: runtimeIsModelLocked,
  isActiveModelDeleted: runtimeIsActiveModelDeleted,
  isActiveModelUnavailable: runtimeIsActiveModelUnavailable,
  conversations: runtimeConversations,
  refreshHistories,
  syncHistoriesInBackground,
  toggleHistoryBookmark,
  renameHistory,
  removeHistory,
  selectAssistant: selectRuntimeAssistant,
  ensureConversation: ensureRuntimeConversation,
  setMessages: chatStore.setMessages.bind(chatStore),
  createRemoteConversation: createRemoteRuntimeConversation,
  clearActiveSession: chatStore.clearActiveSession.bind(chatStore),
  appendUserAndAssistantMessages: appendRuntimeUserAndAssistantMessages,
  revokeMessageAttachments,
};

const workspaceRef = ref(null);
const appShellStore = useAppShellStore();
appShellStore.setThemeName(theme.current);
const themeName = computed(() => appShellStore.themeName);
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

configureResponseOverlay({
  shouldSuppressChatRouteLoad: computed(() =>
    Boolean(pageState.isChatPage?.value)
  ),
  suppressChatRouteLoadId: activeHistoryId,
});
setupResponseOverlayBackGuard();

const showScrollBottom = ref(false);
let bottomStateTimer = 0;
let latestUserScrollTimerIds = [];
let pendingBottomScrollRafId = 0;
let pendingBottomScrollFrameCount = 0;

function getMessageListRef() {
  const exposed = workspaceRef.value?.listRef;
  if (exposed?.scrollToBottom || exposed?.scrollToLatestUserMessage) {
    return exposed;
  }
  if (
    exposed?.value?.scrollToBottom ||
    exposed?.value?.scrollToLatestUserMessage
  ) {
    return exposed.value;
  }
  return null;
}

function clearLatestUserScrollTimers() {
  latestUserScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  latestUserScrollTimerIds = [];
}

function clearPendingBottomScrollScheduler() {
  if (!pendingBottomScrollRafId || typeof window === "undefined") {
    pendingBottomScrollRafId = 0;
    pendingBottomScrollFrameCount = 0;
    return;
  }

  window.cancelAnimationFrame(pendingBottomScrollRafId);
  pendingBottomScrollRafId = 0;
  pendingBottomScrollFrameCount = 0;
}

function updateScrollBottomButton() {
  const list = getMessageListRef();
  showScrollBottom.value =
    Boolean(pageState.isConversationPage?.value) &&
    Boolean(list && !list.isAtBottom?.());
}

function applyBottomScrollWhenListReady(options = {}) {
  const list = getMessageListRef();
  if (!list?.scrollToBottom) return false;

  if (options.afterRender && list.scrollToBottomAfterRender) {
    list.scrollToBottomAfterRender({...options, force: true, stable: true});
  } else {
    list.scrollToBottom({...options, force: true, stable: true});
  }

  updateScrollBottomButton();
  return true;
}

function scheduleBottomScrollWhenListReady(options = {}) {
  clearPendingBottomScrollScheduler();

  if (applyBottomScrollWhenListReady(options)) return;
  if (typeof window === "undefined") return;

  const check = () => {
    pendingBottomScrollRafId = 0;
    pendingBottomScrollFrameCount += 1;

    if (applyBottomScrollWhenListReady(options)) {
      pendingBottomScrollFrameCount = 0;
      return;
    }

    if (pendingBottomScrollFrameCount >= LIST_READY_SCROLL_MAX_FRAMES) {
      pendingBottomScrollFrameCount = 0;
      updateScrollBottomButton();
      return;
    }

    pendingBottomScrollRafId = window.requestAnimationFrame(check);
  };

  pendingBottomScrollRafId = window.requestAnimationFrame(check);
}

async function scrollBottom(options = {}) {
  const list = getMessageListRef();
  if (list?.scrollToBottom) {
    clearPendingBottomScrollScheduler();
    if (options.afterRender && list.scrollToBottomAfterRender) {
      list.scrollToBottomAfterRender(options);
    } else {
      list.scrollToBottom(options);
    }
    updateScrollBottomButton();
    return;
  }

  updateScrollBottomButton();

  if (options.force || options.stable) {
    scheduleBottomScrollWhenListReady(options);
  }
}

async function scrollInitialTarget(scrollTarget = {}, options = {}) {
  const target = scrollTarget || {type: MESSAGE_SCROLL_TARGET_TYPES.bottom};
  const behavior = options.behavior || target.behavior || "auto";
  const list = getMessageListRef();

  if (target.type === MESSAGE_SCROLL_TARGET_TYPES.message) {
    const applied = list?.scrollToMessage?.(target.messageId, {
      behavior,
      block: target.block || options.block || "center",
    });
    updateScrollBottomButton();
    return Boolean(applied);
  }

  if (target.type === MESSAGE_SCROLL_TARGET_TYPES.first) {
    const applied = list?.scrollToTop?.({behavior});
    updateScrollBottomButton();
    return Boolean(applied);
  }

  await scrollBottom({force: true, behavior, ...options});
  return true;
}

async function scrollLatestUserMessage(options = {}) {
  clearLatestUserScrollTimers();

  const apply = () => {
    const list = getMessageListRef();
    if (!list?.scrollToLatestUserMessage) return false;

    list.scrollToLatestUserMessage({
      stable: true,
      ...options,
    });
    updateScrollBottomButton();
    return true;
  };

  if (apply()) return;

  if (options.initialOnly) {
    const timerId = window.setTimeout(() => {
      apply();
      clearLatestUserScrollTimers();
    }, 0);
    latestUserScrollTimerIds.push(timerId);
    return;
  }

  [0, 32, 80, 160, 320].forEach((delay) => {
    const timerId = window.setTimeout(apply, delay);
    latestUserScrollTimerIds.push(timerId);
  });
}

function scheduleBottomStateCheck() {
  window.clearTimeout(bottomStateTimer);
  bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
}

function handleMessageContentRendered() {
  scheduleBottomStateCheck();
}

function cleanupScrollResources() {
  window.clearTimeout(bottomStateTimer);
  clearLatestUserScrollTimers();
  clearPendingBottomScrollScheduler();
}

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
    history?.id ||
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
  if (chatStreamStore.isWait) return;

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

      if (String(activeHistoryId.value) === String(target.id)) {
        conversationMessages.value = [];
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
  if (chatStreamStore.isWait) return;
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
}

async function navigateToMainAfterReset() {
  await navigateToMainAfterConversationReset(
    router,
    clearConversationNavigationState
  );
}

async function resetChatState({assistantId = null} = {}) {
  if (chatStreamStore.isWait) return;

  clearConversationNavigationState();
  runtime.revokeMessageAttachments(conversationMessages.value);
  conversationMessages.value = [];

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
  useEventListener(window, "scroll", scheduleBottomStateCheck, {
    capture: true,
    passive: true,
  });
}

function handleRuntimeOverlayApplied() {
  syncMobileViewportSettings();
  refreshViewport();
  scrollBottom({stable: true});
}

function cleanupConversationForNavigation() {
  runtime.revokeMessageAttachments(conversationMessages.value);
  conversationMessages.value = [];
}

const unregisterActiveConversationCleanup = registerActiveConversationCleanup(
  cleanupConversationForNavigation
);

function cleanupUiResources() {
  unregisterActiveConversationCleanup();
  cleanupScrollResources();
  runtime.revokeMessageAttachments(conversationMessages.value);
}

const runtimeReady = ref(false);
const overlayBackStore = useOverlayStore();
const messages = conversationMessages;
const assistants = runtime.assistants;
const currentAssistant = runtime.currentAssistant;
const selectedAssistantId = runtime.selectedAssistantId;
const selectedModel = runtime.selectedModel;
const isActiveModelUnavailable = runtime.isActiveModelUnavailable;
const activeSession = runtime.activeSession;
const histories = runtime.histories;

function findHistory(id) {
  const targetId = normalizeHistoryId(id);
  if (!targetId) return null;
  return (
    histories.value.find(
      (history) => normalizeHistoryId(history.id) === targetId
    ) || null
  );
}

const activeHistory = computed(() => findHistory(activeHistoryId.value));

function isShareChatEntryRoute() {
  return route.name === ROUTE_NAMES.SHARE_CHAT_ENTRY;
}

async function findHistoryWithShareChatRefresh(id) {
  const targetId = normalizeHistoryId(id);
  if (!targetId) return null;

  const cachedHistory = findHistory(targetId);
  if (cachedHistory || !isShareChatEntryRoute()) return cachedHistory;

  await refreshHistories({notifyOnError: false});
  return findHistory(targetId);
}

async function replaceShareChatEntryWithChatRoute(historyId) {
  if (!isShareChatEntryRoute()) return;

  const id = normalizeHistoryId(historyId);
  if (!id) return;

  chatStore.setPendingSelectedChatId(id);
  chatStore.setActiveChatRoom(id);

  try {
    await router.replace({name: ROUTE_NAMES.CHAT_ENTRY});
  } catch (_error) {
    // 라우터 이동 실패 시에도 임시 선택 상태는 남기지 않습니다.
  } finally {
    clearPendingSelectedChatId(id);
  }
}

const isReadOnly = computed(
  () =>
    pageState.isSharedPage.value ||
    chatStore.isActiveSharedRoom ||
    isSharedChat(activeHistory.value)
);

const messageRenderPolicy = computed(() =>
  resolveMessageRenderPolicy(activeHistory.value, route.query?.messageId)
);

function getSharedEntryId() {
  if (route.name !== ROUTE_NAMES.SHARED_ENTRY) return "";
  return String(route.params?.id || route.params?.shareId || "").trim();
}

function clearPendingSelectedChatId(chatId) {
  const pendingId = normalizeHistoryId(chatStore.pendingSelectedChatId);
  const targetId = normalizeHistoryId(chatId);
  if (!pendingId || pendingId === targetId) {
    chatStore.clearPendingSelectedChatId();
  }
}

async function reconcileHiddenConversationRoute() {
  const result = resolveHiddenConversationRoute(route);

  if (!result.shouldRedirect) return false;

  if (result.nextActiveChatId) {
    chatStore.setActiveChatRoom(result.nextActiveChatId);
  }

  await router.replace(result.nextRoute).catch(() => {});
  return true;
}

function isMermaidRenderingEnabled() {
  return isMermaidRenderingEnabledForPlatform();
}

function hasMermaidInHistoryMessages(sourceMessages = []) {
  if (!isMermaidRenderingEnabled()) return false;
  const list = Array.isArray(sourceMessages) ? sourceMessages : [];
  return list.some((message) => {
    const content = `${message?.content || ""}
${message?.reasoningContent || ""}`;
    return /```\s*mermaid/i.test(content);
  });
}

const isHistoryRendering = ref(false);
const historyMarkdownVisible = ref(false);
const historyMessagesLoaded = ref(false);
let historyRenderOverlayActive = false;
let historyRenderFinishSeq = 0;

async function flushConversationSwitchPaint({clearMessages = true} = {}) {
  if (clearMessages) {
    messages.value = [];
  }

  await nextTick();
  await waitForNextPaint();
}

function beginHistoryRender() {
  historyRenderFinishSeq += 1;
  historyMessagesLoaded.value = false;
  historyMarkdownVisible.value = false;
  isHistoryRendering.value = true;
  if (isProgressAllowedForCurrentPlatform() && !historyRenderOverlayActive) {
    apiRequestStore.startOverlay();
    historyRenderOverlayActive = true;
  }
}

function finishHistoryRenderImmediately() {
  historyRenderFinishSeq += 1;
  historyMessagesLoaded.value = false;
  historyMarkdownVisible.value = false;
  isHistoryRendering.value = false;
  if (historyRenderOverlayActive) {
    apiRequestStore.stopOverlay();
  }
  historyRenderOverlayActive = false;
}

function finishHistoryRender() {
  const finishSeq = ++historyRenderFinishSeq;

  const revealAfterPaint = async () => {
    try {
      await nextTick();
      await waitForNextPaint();
      if (finishSeq !== historyRenderFinishSeq) return;

      const skipFinalScrollTarget = historyMarkdownVisible.value;
      isHistoryRendering.value = false;
      historyMarkdownVisible.value = false;

      if (skipFinalScrollTarget) return;

      await nextTick();
      if (finishSeq !== historyRenderFinishSeq) return;
      await scrollInitialTarget(messageRenderPolicy.value.scrollTarget, {
        behavior: "auto",
      });

      await waitForNextPaint();
      if (finishSeq !== historyRenderFinishSeq) return;
      await scrollInitialTarget(messageRenderPolicy.value.scrollTarget, {
        behavior: "auto",
      });

      await waitForNextPaint();
      if (finishSeq !== historyRenderFinishSeq) return;
      await scrollInitialTarget(messageRenderPolicy.value.scrollTarget, {
        behavior: "auto",
      });
    } finally {
      if (finishSeq === historyRenderFinishSeq) {
        historyMessagesLoaded.value = false;
        if (historyRenderOverlayActive) {
          apiRequestStore.stopOverlay();
        }
        historyRenderOverlayActive = false;
      }
    }
  };

  void revealAfterPaint();
}

function cleanupHistoryRender() {
  finishHistoryRenderImmediately();
}

function clearLazyHistoryMessages() {
  messages.value = [];
}

function setHistoryMessagesForInitialRender(sourceMessages = []) {
  messages.value = Array.isArray(sourceMessages) ? sourceMessages : [];
}

function syncVisibleHistoryMessagesFromFull(sourceMessages = []) {
  messages.value = Array.isArray(sourceMessages) ? sourceMessages : [];
  return true;
}

function setConversationPreservingLazyHistory(chatId, nextMessages) {
  messages.value = Array.isArray(nextMessages) ? nextMessages : [];
  runtime.setMessages(chatId, messages.value);
}

function appendUserAndAssistantMessagesPreservingLazyHistory(
  chatId,
  normalized
) {
  const result = runtime.appendUserAndAssistantMessages(chatId, normalized);
  if (Array.isArray(result.messages)) {
    messages.value = result.messages;
  }
  return result;
}

const activeConversationTitle = computed(() =>
  resolveConversationTitle(
    pageState.isSharedPage.value,
    activeHistoryId.value,
    activeHistory.value,
    t
  )
);

const workspaceAssistantLabel = computed(() =>
  resolveWorkspaceAssistantLabel(
    activeSession.value,
    currentAssistant.value,
    t("chat.assistant")
  )
);

function resetMainRouteConversation() {
  finishHistoryRender();
  clearLazyHistoryMessages();
  messages.value = [];
  chatStore.pruneInactiveMessageCache(null);
  runtime.clearActiveSession();
}

async function handleMissingHistoryId({isCurrentLoad}) {
  const hasPendingChatEntryNavigation = hasPendingChatNavigation();

  beginHistoryRender();
  await flushConversationSwitchPaint();
  if (!isCurrentLoad()) return;
  clearLazyHistoryMessages();
  messages.value = [];

  if (!hasPendingChatEntryNavigation) {
    runtime.clearActiveSession();
  }
  finishHistoryRender();

  if (!hasPendingChatEntryNavigation) {
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
  }
}

async function redirectMissingHistory() {
  clearPendingSelectedChatId(activeHistoryId.value);
  finishHistoryRender();
  await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
}

async function applyPendingNewSubmitHistory(history) {
  finishHistoryRender();
  clearPendingSelectedChatId(history.id);
  clearLazyHistoryMessages();
  messages.value = runtime.conversations.value?.[history.id] || [];
  historyMessagesLoaded.value = true;
  await nextTick();
}

async function hydrateHistoryConversation({history, isCurrentLoad, signal}) {
  chatStore.setPendingSelectedChatId(history.id);
  beginHistoryRender();
  const mermaidWarmupPromise = isMermaidRenderingEnabled()
    ? warmupMermaidForHistoryRender().catch(() => null)
    : Promise.resolve(null);

  try {
    await flushConversationSwitchPaint();
    if (!isCurrentLoad()) return;
    chatStore.pruneInactiveMessageCache(history.id);
    const loadedMessages = await runtime.ensureConversation(history.id, {signal});
    if (hasMermaidInHistoryMessages(loadedMessages)) {
      await mermaidWarmupPromise;
    }
    if (!isCurrentLoad()) return;
    setHistoryMessagesForInitialRender(loadedMessages);
    historyMessagesLoaded.value = true;
    await nextTick();
    chatStore.pruneInactiveMessageCache(history.id);
  } finally {
    clearPendingSelectedChatId(history.id);
  }
}

async function loadHistoryRouteConversation({isCurrentLoad, signal}) {
  if (pageState.isMainPage.value) {
    resetMainRouteConversation();
    return;
  }

  if (!activeHistoryId.value) {
    await handleMissingHistoryId({isCurrentLoad});
    return;
  }

  const history = await findHistoryWithShareChatRefresh(activeHistoryId.value);
  if (!history) {
    await redirectMissingHistory();
    return;
  }

  if (chatStore.consumePendingNewSubmitChat(history.id)) {
    await applyPendingNewSubmitHistory(history);
    return;
  }

  await hydrateHistoryConversation({history, isCurrentLoad, signal});

  if (isCurrentLoad()) {
    await replaceShareChatEntryWithChatRoute(history.id);
  }
}

async function redirectSharedNotFound() {
  const message = t("chat.sharedNotFoundMessage");
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(message);
  }
  chatStore.clearActiveRoom();
  clearLazyHistoryMessages();
  messages.value = [];
  finishHistoryRenderImmediately();
  await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
}

async function loadSharedRouteConversation({isCurrentLoad, signal}) {
  beginHistoryRender();
  await flushConversationSwitchPaint();
  if (!isCurrentLoad()) return;

  const sharedEntryId = getSharedEntryId();
  if (sharedEntryId) {
    const result = await getSharedConversation(sharedEntryId, {signal});
    if (!isCurrentLoad()) return;
    if (!result.exists) {
      await redirectSharedNotFound();
      return;
    }
    chatStore.setActiveSharedRoom(result.shareId || sharedEntryId);
    await router.replace({name: ROUTE_NAMES.SHARED}).catch(() => {});
    if (!isCurrentLoad()) return;
    setHistoryMessagesForInitialRender(result.messages);
    historyMessagesLoaded.value = true;
    await nextTick();
    finishHistoryRender();
    return;
  }

  if (!activeHistoryId.value) {
    clearLazyHistoryMessages();
    messages.value = [];
    finishHistoryRender();
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
    return;
  }

  const result = await getSharedConversation(activeHistoryId.value, {signal});
  if (!isCurrentLoad()) return;
  if (!result.exists) {
    await redirectSharedNotFound();
    return;
  }

  setHistoryMessagesForInitialRender(result.messages);
  historyMessagesLoaded.value = true;
  await nextTick();
  finishHistoryRender();
}

let routeConversationLoadSeq = 0;
let routeConversationAbortController = null;

function isRouteConversationAbortError(error) {
  return (
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED" ||
    error?.message === "canceled" ||
    error?.message === "The mock request was aborted."
  );
}

function abortRouteConversationLoad() {
  routeConversationAbortController?.abort?.();
  routeConversationAbortController = null;
}

function createRouteConversationLoadContext() {
  abortRouteConversationLoad();

  const loadSeq = ++routeConversationLoadSeq;
  const controller =
    typeof AbortController === "function" ? new AbortController() : null;

  routeConversationAbortController = controller;

  return {
    signal: controller?.signal,
    isCurrentLoad: () => loadSeq === routeConversationLoadSeq,
  };
}

async function loadRouteConversation() {
  const {signal, isCurrentLoad} = createRouteConversationLoadContext();

  try {
    if (pageState.isSharedPage.value) {
      await loadSharedRouteConversation({isCurrentLoad, signal});
      return;
    }

    await loadHistoryRouteConversation({isCurrentLoad, signal});
  } catch (error) {
    if (!isCurrentLoad() || isRouteConversationAbortError(error)) return;

    if (pageState.isSharedPage.value) {
      await redirectSharedNotFound({
        message: error?.message || t("chat.sharedNotFoundMessage"),
      });
      return;
    }
    clearPendingSelectedChatId(activeHistoryId.value);
    finishHistoryRender();
    logWarn("[ChatContainer] loadRouteConversation 오류:", error);
  } finally {
    if (isCurrentLoad()) {
      routeConversationAbortController = null;
    }
  }
}

function invalidateRouteLoad() {
  routeConversationLoadSeq += 1;
  abortRouteConversationLoad();
}

function shouldLoadRouteConversation() {
  return pageState.isMainPage.value || pageState.isConversationPage.value;
}

function syncHistoriesAfterChatSubmit() {
  return runtime.syncHistoriesInBackground({notifyOnError: true});
}

function canSubmitChatMessage() {
  return (
    !isReadOnly.value &&
    !isHistoryRendering.value &&
    !isActiveModelUnavailable.value
  );
}

function getVisibleChatMessagesForSubmit() {
  return Array.isArray(messages.value) ? messages.value : [];
}

configureChatSubmit(
  runtime.createRemoteConversation,
  appendUserAndAssistantMessagesPreservingLazyHistory,
  setConversationPreservingLazyHistory,
  getVisibleChatMessagesForSubmit,
  scrollLatestUserMessage,
  syncHistoriesAfterChatSubmit,
  canSubmitChatMessage,
  router,
  route
);

const isGenerating = computed(() => chatStreamStore.isWait);

function isRouteLoadSourceChanged(nextSource = [], previousSource = []) {
  return (
    JSON.stringify(nextSource || []) !== JSON.stringify(previousSource || [])
  );
}

function isRealRouteLoadTargetChanged(nextSource = [], previousSource = []) {
  return (
    String(nextSource?.[0] || "") !== String(previousSource?.[0] || "") ||
    String(nextSource?.[1] || "") !== String(previousSource?.[1] || "") ||
    String(nextSource?.[2] || "") !== String(previousSource?.[2] || "") ||
    String(nextSource?.[3] || "") !== String(previousSource?.[3] || "") ||
    String(nextSource?.[4] || "") !== String(previousSource?.[4] || "") ||
    String(nextSource?.[5] || "") !== String(previousSource?.[5] || "")
  );
}

function shouldSkipRouteLoadForOverlayBack(nextSource, previousSource) {
  if (!overlayBackStore.shouldSuppressChatRouteLoad(activeHistoryId.value)) {
    return false;
  }

  const sourceChanged = isRouteLoadSourceChanged(nextSource, previousSource);
  const realTargetChanged = isRealRouteLoadTargetChanged(
    nextSource,
    previousSource
  );

  if (sourceChanged && realTargetChanged) {
    overlayBackStore.clearSuppressNextChatRouteLoad();
    return false;
  }

  overlayBackStore.consumeSuppressNextChatRouteLoad(activeHistoryId.value);
  return true;
}

function bindDataEvents() {
  watch(
    () => [
      route.params.id,
      route.params.shareId,
      activeHistoryId.value,
      route.query?.messageId,
      currentMode.value,
    ],
    async (nextSource, previousSource) => {
      if (!runtimeReady.value) return;
      if (!shouldLoadRouteConversation()) {
        invalidateRouteLoad();
        return;
      }
      if (shouldSkipRouteLoadForOverlayBack(nextSource, previousSource)) {
        invalidateRouteLoad();
        return;
      }
      if (await reconcileHiddenConversationRoute()) return;
      loadRouteConversation();
    }
  );

  watch(
    () => {
      if (!pageState.isChatPage.value || !activeHistoryId.value) return null;
      return runtime.conversations.value?.[activeHistoryId.value] || null;
    },
    (nextMessages) => {
      if (!Array.isArray(nextMessages)) return;
      if (isHistoryRendering.value) return;
      if (messages.value === nextMessages) return;

      if (syncVisibleHistoryMessagesFromFull(nextMessages)) {
        return;
      }

      messages.value = nextMessages;
    },
    {deep: true}
  );
}

function initializeDataFlow() {
  onMounted(async () => {
    try {
      await runtime.initialize();
    } catch (error) {
      logWarn("[ChatContainer] runtime.initialize 오류:", error);
    }
    if (shouldLoadRouteConversation()) {
      if (await reconcileHiddenConversationRoute()) {
        await nextTick();
      }
      await loadRouteConversation();
    } else {
      invalidateRouteLoad();
    }
    runtimeReady.value = true;
  });
}


bindUiEvents();
bindDataEvents();
initializeDataFlow();

onBeforeUnmount(() => {
  cleanupUiResources();
  invalidateRouteLoad();
  cleanupHistoryRender();
});

const shellReady = computed(
  () => runtimeReady.value || appRuntimeStore.initialized
);

const isChatContainerHistoryBusy = computed(() =>
  resolveBooleanSource(isHistoryRendering)
);
const isConversationActionBlocked = computed(
  () => chatStreamStore.isWait || isChatContainerHistoryBusy.value
);
const chatPageLock = {
  isConversationActionBlocked,
  isSubmitBlocked: computed(
    () =>
      isConversationActionBlocked.value ||
      chatStreamStore.isWait ||
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

provideMessageActions({
  regenerate: handleWorkspaceRegenerate,
  messageContentRendered: handleMessageContentRendered,
  historyRendered: finishHistoryRender,
});

provideStudioDetailActions({
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
function setWorkspaceRef(el) {
  workspaceRef.value = el;
}

function handleWorkspaceRegenerate(message) {
  if (chatPageLock.isRegenerateBlocked.value) return;
  regenerateLastAnswer(message);
}

function handleWorkspaceScrollBottom() {
  scrollBottom({force: true, behavior: "smooth", stable: true});
}
</script>

<style scoped lang="scss">
.chat-container-root {
  min-width: 0;
  min-height: 0;
}
</style>
