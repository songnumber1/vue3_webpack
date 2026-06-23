<template>
  <ChatLayout
    v-if="shellReady"
    :keyboard-open="layoutKeyboardOpen"
    :mode="routeMode"
  >
    <slot :set-workspace-ref="setWorkspaceRef" />

    <!-- 이미지 크게 보기 -->
    <ChatImagePreview
      :image="previewImage"
      @close="closeImagePreview"
      @load="handlePreviewLoad"
      @error="handlePreviewError"
    />

    <AssistantSelectSheet
      :open="assistantSheetOpen"
      :assistants="visibleAssistants"
      :selected-assistant-id="selectedAssistantId"
      @close="assistantSheetOpen = false"
      @select="handleAssistantNewChat"
    />

    <ResponseOverlayHost @applied="handleSystemSettingsApplied" />

    <StudioDetailViewer
      :open="studioDetailOpen"
      :studio="studioDetailStudio"
      :is-mobile="isMobile"
      :allow-actions="true"
      :actions-disabled="isStudioDetailBlocked"
      @close="closeStudioDetail"
      @edit="handleStudioDetailEdit"
      @delete="handleStudioDetailDelete"
    />

    <VirtualKeyboardDebug :visible="showVirtualKeyboardDebugButton" />

    <ChatHistoryActionDialog
      :open="historyDialogOpen"
      :mode="historyDialogMode"
      :title="historyDialogTitle"
      :message="historyDialogMessage"
      :initial-title="historyDialogTarget?.title || ''"
      @cancel="closeHistoryDialog"
      @confirm="confirmHistoryDialog"
    />

    <ResponsiveOverlay
      :open="historyNoticeOpen"
      :title="t('common.notice')"
      mobile-mode="dialog"
      @close="historyNoticeOpen = false"
    >
      <div class="chat-history-dialog">
        <p class="chat-history-dialog__message">{{ historyNoticeMessage }}</p>
        <div class="chat-history-dialog__actions">
          <button
            class="playground-button"
            type="button"
            @click="historyNoticeOpen = false"
          >
            {{ t("common.confirm") }}
          </button>
        </div>
      </div>
    </ResponsiveOverlay>
  </ChatLayout>

  <div v-else class="chat-bootstrap-loading" aria-live="polite">
    <span class="chat-bootstrap-loading__dot"></span>
  </div>
</template>

<script setup>
/**
 * @file containers/chat/ChatContainer.vue
 * @description 채팅 화면의 최상위 조립 계층입니다. 주요 상태와 action을 직접 import로 하위 Vue 컴포넌트에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
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
import {useAssistantStore} from "@/stores/assistantStore";
import {useNavigationStore} from "@/stores/navigationStore";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import {
  CHAT_ACTIONS_KEY,
  CHAT_WORKSPACE_STATE_KEY,
  PROMPT_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
} from "@/composables/chat/chatActionContext";
import AssistantSelectSheet from "@/components/assistant/AssistantSelectSheet.vue";
import ChatImagePreview from "@/components/chat/ChatImagePreview.vue";
import ChatLayout from "@/components/chat/ChatLayout.vue";
import ResponseOverlayHost from "@/components/overlay/ResponseOverlayHost.vue";
import ChatHistoryActionDialog from "@/components/navigation/controls/ChatHistoryActionDialog.vue";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";
import VirtualKeyboardDebug from "@/components/debug/VirtualKeyboardDebug.vue";
import StudioDetailViewer from "@/components/studio/StudioDetailViewer.vue";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useChatStore} from "@/stores/chatStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {useAppBootstrap} from "@/composables/app/useAppBootstrap";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {
  renderMermaidInElement,
  warmupMermaidForHistoryRender,
} from "@/utils/mermaidRenderer";
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
import {
  appendUserAndAssistantMessages as appendMessagesToChat,
  revokeMessageAttachments,
} from "@/composables/chat/runtime/useMessageAppender";
import {
  createLocalHistory,
  createSessionFromHistory,
} from "@/composables/chat/runtime/chatSessionFactory";
import {
  markSessionAsMissingAssistant,
  resolveConversationSessionState,
} from "@/composables/chat/internal/policy/chatSessionPolicy";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAppShellThemeState} from "@/composables/app/useAppShellThemeState";
import {useAutoScroll} from "@/composables/chat/useAutoScroll";
import {useImagePreview} from "@/composables/chat/useImagePreview";
import {useViewportGuard} from "@/platform/viewport/useViewportGuard";
import {usePlatformStore} from "@/stores/platformStore";
import {useViewportStore} from "@/stores/viewportStore";
import {syncViewportSettings} from "@/utils/applyViewportBreakpoint";
import {isProgressAllowedForCurrentPlatform} from "@/composables/progress/progressPolicy";
import {
  configureResponseOverlay,
  setupResponseOverlayBackGuard,
} from "@/composables/overlay/responseOverlayActions";
import {useChatAssistantSheetState} from "@/composables/chat/header/useChatAssistantSheetState";
import {
  hasPendingChatNavigation,
  resolveActiveChatId,
  resolveHiddenConversationRoute,
} from "@/composables/chat/internal/policy/chatRoutePolicy";
import {useRouteMode} from "@/composables/route/useRouteMode";
import {deleteStudio} from "@/services/studioDetailService";
import {
  cleanupActiveConversationForNavigation,
  registerActiveConversationCleanup,
} from "@/composables/chat/conversation/useActiveConversationCleanup";
import {
  cleanupAfterPortalConversationNavigation,
  clearConversationNavigationState as clearConversationNavigationStateByPolicy,
  navigateToMainAfterConversationReset,
  preparePortalConversationNavigation,
} from "@/composables/chat/internal/navigation/chatNavigationReset";
import {
  createPortalAssistantRoute,
  getPortalAssistantIdByRouteName,
} from "@/composables/chat/internal/navigation/portalAssistantRoutePolicy";
import {
  isStudioAssistant,
  normalizeStudioDetail,
} from "@/composables/studio/useStudioDetailModel";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";
import {useChatSubmit} from "@/composables/chat/useChatSubmit";
import {
  isSharedChat,
  resolveMessageRenderPolicy,
} from "@/composables/chat/internal/message-list/useMessageRenderPolicy";
import {
  HISTORY_RENDER_STRATEGIES,
  MESSAGE_SCROLL_TARGET_TYPES,
} from "@/composables/chat/internal/message-list/messageRenderPolicyTypes";
import {
  resolveInitialMessageLazyRange,
  resolveMessageLazySettings,
  resolvePreviousMessageLazyStart,
} from "@/composables/chat/internal/message-list/useMessageLazyRange";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {
  resolveConversationTitle,
  resolveWorkspaceAssistantLabel,
} from "@/composables/chat/internal/policy/chatHeaderPolicy";
import {useAppOverlayBackStore} from "@/stores/appOverlayBackStore";
import {getSharedConversation} from "@/composables/chat/useSharedChat";

/**
 * [ChatContainer 연결 구조]
 * 이 파일은 ChatContainer에서 route/page 상태와 주요 UI/data 흐름을 직접 연결합니다.
 * Header/Workspace/Prompt/ImagePreview/Sheet는 서로 직접 import하지 않고 provide/inject 또는 props/event로 연결됩니다.
 * 따라서 문제 추적 시 ChatContainer에서 직접 import한 store/function 흐름을 우선 확인합니다.
 */

const LIST_READY_SCROLL_MAX_FRAMES = 60;

function toLockValue(source) {
  return Boolean(source?.value ?? source);
}

function shouldUseMobilePlatformLayout(platformInfo = {}) {
  if (platformInfo.isPlatformForced) {
    return Boolean(
      platformInfo.isAndroidApp ||
        platformInfo.isNativeApp ||
        platformInfo.isNativeRuntime ||
        (platformInfo.actualEnv === "android" &&
          platformInfo.actualRuntime !== "native")
    );
  }

  return Boolean(
    platformInfo.isMobileBrowser ||
      platformInfo.isAndroidApp ||
      platformInfo.isNativeApp ||
      platformInfo.isNativeRuntime
  );
}

function waitForNextPaint() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

function waitAnimationFrame() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function normalizeMessageId(value) {
  const id = String(value || "").trim();
  return id || null;
}

function findMessageIndexById(messages = [], messageId) {
  const targetId = normalizeMessageId(messageId);
  if (!targetId) return -1;

  return messages.findIndex(
    (message) => String(message?.id || "") === targetId
  );
}

function clampRangeStart(start, count, length) {
  if (length <= 0) return 0;
  const normalizedCount = Math.max(1, Math.min(count, length));
  return Math.max(0, Math.min(start, length - normalizedCount));
}

const route = useRoute();
const router = useRouter();
const appRuntimeStore = useAppRuntimeStore();
const systemSettingsStore = useSystemSettingsStore();
const assistantStore = useAssistantStore();
const chatStore = useChatStore();
const chatStreamStore = useChatStreamStore();
const apiRequestStore = useApiRequestStore();
const navigationStore = useNavigationStore();
const studioRuntimeStore = useStudioRuntimeStore();
const navigationLock = useNavigationLock();
const {
  NAVIGATION_LOCK_SCOPES,
  isGlobalLocked,
  isStreamingLocked,
  isChatHistoryLocked,
  releaseLock,
} = navigationLock;
const appBootstrap = useAppBootstrap();
const {
  assistants: assistantListRef,
  selectedAssistantId: selectedAssistantIdRef,
  selectedModelId: selectedModelIdRef,
  examplePromptMap,
} = storeToRefs(assistantStore);
const {histories: historyListRef} = storeToRefs(chatStore);
const {showVirtualKeyboardDebug} = storeToRefs(systemSettingsStore);
async function refreshHistories({notifyOnError = false} = {}) {
  try {
    const chatHistories = await loadChatHistoryList({
      assistantMap: assistantStore.assistantMap,
      modelMap: assistantStore.modelMap,
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
  Promise.resolve()
    .then(() => refreshHistories(options))
    .catch((error) => {
      logWarn("[ChatContainer] syncHistoriesInBackground 오류:", error);
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
const routeMode = useRouteMode();
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

const activeHistoryId = computed(() => {
  if (pageState.isChatPage.value) {
    return resolveActiveChatId({
      route,
      chatStore,
      settings: systemSettingsStore.settings,
    });
  }
  if (pageState.isSharedPage.value) {
    return chatStore.activeRoomType === "shared"
      ? String(chatStore.activeRoomId || "").trim()
      : String(route.params?.id || route.params?.shareId || "").trim();
  }
  return null;
});
pageState.activeHistoryId = activeHistoryId;

const {t, locale} = useI18n();
const {theme} = useAppContext();
const platformStore = usePlatformStore();
const viewportStore = useViewportStore();

syncViewportSettings(systemSettingsStore.mobileBreakpoint);

const runtimeCurrentAssistant = computed(
  () =>
    assistantStore.currentAssistant ||
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
const runtimeModels = computed(() => {
  if (!chatStore.isModelLocked) return assistantStore.currentModels;
  return [assistantStore.modelMap[chatStore.activeSession?.modelId]].filter(
    Boolean
  );
});
const runtimeSelectedModel = computed({
  get: () => chatStore.activeSession?.modelId || selectedModelIdRef.value,
  set: (id) => {
    if (chatStore.isModelLocked) return;
    assistantStore.selectModel(id);
  },
});
const runtimeIsModelLocked = computed(() => chatStore.isModelLocked);
const runtimeConversations = computed(() => chatStore.messageMap);

async function initializeRuntime() {
  await appBootstrap.ensureInitialized();
}

async function preloadRuntimeExamplePrompts(assistantId) {
  if (!assistantId || assistantStore.examplePromptMap[assistantId]) return;
  try {
    const assistant = assistantStore.assistantMap[assistantId];
    const prompts = await loadExamplePrompts({
      assistantId,
      studioYN: assistant?.type === "studio",
    });
    assistantStore.setExamplePrompts(assistantId, prompts);
  } catch (error) {
    logWarn("[ChatContainer] preloadExamplePrompts 오류:", error);
  }
}

function shouldPreserveSidebarAssistantOnHistoryOpen() {
  if (typeof document === "undefined") return false;
  const classList = document.body?.classList;
  return (
    classList?.contains("desktop-mode") && !classList?.contains("mobile-mode")
  );
}

async function selectRuntimeAssistant(id, {forNewChat = false} = {}) {
  if (!forNewChat && chatStore.isModelLocked) return;
  if (!assistantStore.assistantMap[id]) return;
  try {
    await preloadRuntimeExamplePrompts(id);
    assistantStore.selectAssistant(id);
    if (forNewChat) chatStore.clearActiveSession();
  } catch (error) {
    logWarn("[ChatContainer] selectAssistant 오류:", error);
  }
}

async function ensureRuntimeConversation(historyId) {
  const history = chatStore.getHistory(historyId);
  if (!history) return [];

  const session = createSessionFromHistory(
    history,
    assistantStore.modelMap,
    assistantStore.assistantMap
  );
  const sessionState = resolveConversationSessionState({
    history,
    session,
    assistantMap: assistantStore.assistantMap,
    assistants: assistantStore.assistants,
    studioRuntimeStore,
    preserveSidebarAssistant: shouldPreserveSidebarAssistantOnHistoryOpen(),
  });
  const resolvedSession = sessionState.session || session;

  if (sessionState.nextSelectedAssistantId) {
    assistantStore.selectAssistant(sessionState.nextSelectedAssistantId);
  }

  chatStore.setActiveSession(resolvedSession);

  if (!chatStore.messageMap[history.id]) {
    const messages = await loadChatMessageRouters({
      chatId: history.id,
      assistId: resolvedSession?.assistantId || history.assistantId,
      modelId: resolvedSession?.modelId || history.modelId,
      studio: resolvedSession?.assistantType === "studio",
    });
    chatStore.setMessages(history.id, messages);
  }

  return chatStore.messageMap[history.id] || [];
}

async function createRemoteRuntimeConversation({text, assistantId, modelId} = {}) {
  const chatId = createId();
  const chatTitle = String(text || "")
    .trim()
    .slice(0, 20);
  const assistant = assistantStore.assistantMap?.[assistantId] || null;
  const rawHistory = await createChatHistory({
    chatId,
    assistId: assistantId,
    modelId,
    ChatTilte: chatTitle || String(text || "").trim(),
    studio: assistant?.type === "studio",
  });
  const history = adaptChatHistory(rawHistory, {
    assistantMap: assistantStore.assistantMap,
    modelMap: assistantStore.modelMap,
  });

  if (!history?.id) {
    throw new Error("new.do response does not contain chatId.");
  }

  chatStore.addHistory(history);
  chatStore.setMessages(history.id, []);
  chatStore.setActiveSession(
    createSessionFromHistory(
      history,
      assistantStore.modelMap,
      assistantStore.assistantMap
    )
  );

  return history;
}

function createLocalRuntimeConversation({text} = {}) {
  const history = createLocalHistory({
    text,
    assistant: assistantStore.currentAssistant,
    model: assistantStore.currentModel || assistantStore.currentModels[0],
  });
  chatStore.addHistory(history);
  chatStore.setMessages(history.id, []);
  chatStore.setActiveSession(
    createSessionFromHistory(
      history,
      assistantStore.modelMap,
      assistantStore.assistantMap
    )
  );

  return history;
}

function appendRuntimeUserAndAssistantMessages(chatId, normalized) {
  return appendMessagesToChat({chatStore, chatId, normalized});
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
  createLocalConversation: createLocalRuntimeConversation,
  clearActiveSession: chatStore.clearActiveSession.bind(chatStore),
  appendUserAndAssistantMessages: appendRuntimeUserAndAssistantMessages,
  revokeMessageAttachments,
};

const {scrollToBottom} = useAutoScroll({value: null});
const workspaceRef = ref(null);
const {themeName} = useAppShellThemeState(theme.current);
const {assistantSheetOpen} = useChatAssistantSheetState();
const autoScrollOnAnswer = computed(
  () => systemSettingsStore.autoScrollOnAnswer
);

const {
  previewImage,
  closeImagePreview,
  handlePreviewLoad,
  handlePreviewError,
} = useImagePreview();

const isCompactScreen = computed(() => viewportStore.isCompact);
const platformInfo = computed(() => platformStore.info || {});
const isMobile = computed(() =>
  Boolean(
    isCompactScreen.value || shouldUseMobilePlatformLayout(platformInfo.value)
  )
);

function updateMobileState() {
  // isMobile은 computed라 별도 갱신이 필요 없습니다.
}

configureResponseOverlay({
  isMobile,
  shouldSuppressChatRouteLoad: computed(() =>
    Boolean(pageState.isChatPage?.value)
  ),
  suppressChatRouteLoadId: activeHistoryId,
});
setupResponseOverlayBackGuard(viewportStore);

const showScrollBottom = ref(false);
let bottomStateTimer = 0;
let forceBottomUntil = 0;
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

function markForceBottom(duration = 1800) {
  forceBottomUntil = Date.now() + duration;
}

function clearForceBottom() {
  forceBottomUntil = 0;
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

function shouldKeepForceBottom() {
  return Boolean(autoScrollOnAnswer?.value) && Date.now() <= forceBottomUntil;
}

async function scrollBottom(options = {}) {
  if (options.autoAnswer && !autoScrollOnAnswer?.value) {
    updateScrollBottomButton();
    return;
  }

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

  await scrollToBottom(options);
  updateScrollBottomButton();

  if (options.force || options.stable) {
    scheduleBottomScrollWhenListReady(options);
  }
}

async function scrollInitialTarget(scrollTarget = {}, options = {}) {
  const list = getMessageListRef();
  if (list?.scrollToInitialTarget) {
    list.scrollToInitialTarget(scrollTarget, {behavior: "auto", ...options});
    updateScrollBottomButton();
    return true;
  }

  if (scrollTarget?.type === "bottom") {
    await scrollBottom({force: true, behavior: "auto", ...options});
    return true;
  }

  updateScrollBottomButton();
  return false;
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
  if (shouldKeepForceBottom()) {
    scrollBottom({force: true, stable: true, autoAnswer: true});
  }
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
const historyNoticeOpen = ref(false);
const historyNoticeMessage = ref("");

const historyDialogTitle = computed(() =>
  historyDialogMode.value === "delete"
    ? t("chat.historyDialog.deleteTitle")
    : t("chat.historyDialog.renameTitle")
);

const historyDialogMessage = computed(() =>
  historyDialogMode.value === "delete"
    ? t("chat.historyDialog.deleteMessage", {
        title:
          historyDialogTarget.value?.title ||
          t("chat.historyDialog.selectedConversation"),
      })
    : ""
);

function closeHistoryDialog() {
  historyDialogOpen.value = false;
  historyDialogTarget.value = null;
}

async function confirmHistoryDialog(value) {
  if (chatStreamStore.isStreaming) return;

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
        releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
        await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
        releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
      }
    }
  } catch (error) {
    logWarn("[ChatContainer] confirmHistoryDialog 오류:", error);
  } finally {
    closeHistoryDialog();
  }
}

async function handleHistoryMenuAction({action, history} = {}) {
  if (chatStreamStore.isStreaming) return;
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
    runtime.syncHistoriesInBackground?.({notifyOnError: true});
    historyNoticeMessage.value = t("chat.historyDialog.shareSelected");
    historyNoticeOpen.value = true;
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
  clearConversationNavigationStateByPolicy({
    chatStore,
    releaseLock,
    chatHistoryScope: NAVIGATION_LOCK_SCOPES.chatHistory,
    clearActiveSession: runtime.clearActiveSession,
  });
}

async function navigateToMainAfterReset() {
  await navigateToMainAfterConversationReset({
    router,
    clearBeforeNavigate: clearConversationNavigationState,
  });
}

async function resetChatState({assistantId = null} = {}) {
  if (chatStreamStore.isStreaming) return;

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

  navigationStore.closeTransientPanels();
  navigationStore.setDrawerOpen(false);
  navigationStore.setCollapsedRecentOpen(false);
  clearForceBottom();
  await navigateToMainAfterReset();
}

const startNewChat = resetChatState;

watch(
  () => systemSettingsStore.mobileBreakpoint,
  (breakpoint) => {
    syncViewportSettings(breakpoint);
    refreshViewport();
    updateMobileState();
  }
);

function bindUiEvents() {
  useEventListener(window, "resize", updateMobileState, {passive: true});
  useEventListener(window, "scroll", scheduleBottomStateCheck, {
    capture: true,
    passive: true,
  });
}

function handleSystemSettingsApplied() {
  syncViewportSettings(systemSettingsStore.mobileBreakpoint);
  refreshViewport();
  updateMobileState();
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

function normalizeHistoryId(value) {
  return String(value || "").trim();
}

const runtimeReady = ref(false);
const overlayBackStore = useAppOverlayBackStore();
const messages = conversationMessages;
const assistants = runtime.assistants;
const currentAssistant = runtime.currentAssistant;
const models = runtime.models;
const selectedAssistantId = runtime.selectedAssistantId;
const selectedModel = runtime.selectedModel;
const isModelLocked = runtime.isModelLocked;
const isActiveModelUnavailable = runtime.isActiveModelUnavailable;
const activeSession = runtime.activeSession;
const histories = runtime.histories;
const currentExamplePrompts = runtime.currentExamplePrompts;

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

const isReadOnly = computed(
  () =>
    pageState.isSharedPage.value ||
    chatStore.isActiveSharedRoom ||
    isSharedChat(activeHistory.value)
);

const messageRenderPolicy = computed(() =>
  resolveMessageRenderPolicy({
    isMobile: Boolean(isMobile.value),
    selectedChat: activeHistory.value,
    searchTargetMessageId: route.query?.messageId,
    showPcProgress: systemSettingsStore.settings.showPcProgress,
    settings: systemSettingsStore.settings,
  })
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
  const result = resolveHiddenConversationRoute({
    route,
    chatStore,
  });

  if (!result.shouldRedirect) return false;

  if (result.nextActiveChatId) {
    chatStore.setActiveChatRoom(result.nextActiveChatId);
  }

  await router.replace(result.nextRoute).catch(() => {});
  return true;
}

function isMermaidRenderingEnabled() {
  return isMermaidRenderingEnabledForPlatform(
    systemSettingsStore.settings,
    Boolean(isMobile.value)
  );
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
const fullHistoryMessages = ref([]);
const historyVisibleStartIndex = ref(0);
const progressiveInitialHistoryState = ref(null);
let historyRenderOverlayActive = false;
let historyRenderFinishSeq = 0;
let progressiveInitialHistoryToken = 0;
let progressiveInitialHistoryRunning = false;

async function flushConversationSwitchPaint({
  clearMessages = true,
} = {}) {
  if (clearMessages) {
    messages.value = [];
  }

  await nextTick();
  await waitForNextPaint();
}

function getCurrentChatHistoryLockOwner() {
  return String(
    activeHistoryId.value ||
      chatStore.pendingSelectedChatId ||
      chatStore.selectedChatId ||
      ""
  ).trim();
}

function releaseCurrentChatHistoryLock() {
  const lockEntry = navigationLock.getLock(NAVIGATION_LOCK_SCOPES.chatHistory);
  if (!lockEntry) return;

  const currentOwner = getCurrentChatHistoryLockOwner();
  if (currentOwner && lockEntry.owner === currentOwner) {
    navigationLock.releaseLock(
      NAVIGATION_LOCK_SCOPES.chatHistory,
      currentOwner
    );
    return;
  }

  if (!lockEntry.owner || lockEntry.meta?.source === "ChatContainer") {
    navigationLock.releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
  }
}

function forceReleaseChatHistoryLock() {
  navigationLock.releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
}

function beginHistoryRender() {
  historyRenderFinishSeq += 1;
  historyMessagesLoaded.value = false;
  historyMarkdownVisible.value = false;
  isHistoryRendering.value = true;
  navigationLock.acquireLockIfFree(NAVIGATION_LOCK_SCOPES.chatHistory, {
    owner: String(
      activeHistoryId.value || chatStore.pendingSelectedChatId || "route"
    ),
    reason: "history-render",
    meta: {source: "ChatContainer"},
  });

  if (
    isProgressAllowedForCurrentPlatform(
      systemSettingsStore.settings,
      platformStore.info
    ) &&
    !historyRenderOverlayActive
  ) {
    apiRequestStore.startOverlay();
    historyRenderOverlayActive = true;
  }
}

function finishHistoryRenderImmediately() {
  historyRenderFinishSeq += 1;
  historyMessagesLoaded.value = false;
  historyMarkdownVisible.value = false;
  isHistoryRendering.value = false;
  releaseCurrentChatHistoryLock();
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
      releaseCurrentChatHistoryLock();

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

function getHistoryRenderStrategy() {
  return String(messageRenderPolicy.value?.historyRenderStrategy || "");
}

function isPcProgressiveHistoryRender() {
  return getHistoryRenderStrategy().startsWith("pc-progressive-");
}

function revealHistoryMarkdown() {
  if (!isHistoryRendering.value || !isPcProgressiveHistoryRender()) return;
  historyMarkdownVisible.value = true;
  if (historyRenderOverlayActive) {
    apiRequestStore.stopOverlay();
    historyRenderOverlayActive = false;
  }
}

async function renderAfterStream() {
  try {
    if (autoScrollOnAnswer.value) {
      markForceBottom(1000);
    }

    if (isMermaidRenderingEnabled()) {
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });
    }

    if (autoScrollOnAnswer.value) {
      scrollBottom({force: true, stable: true, autoAnswer: true});
    }
  } catch (error) {
    logWarn("[ChatContainer] renderAfterStream 오류:", error);
  }
}

function invalidateHistoryRender() {
  historyRenderFinishSeq += 1;
}

function cleanupHistoryRender() {
  invalidateHistoryRender();
  historyMarkdownVisible.value = false;
  forceReleaseChatHistoryLock();
  if (historyRenderOverlayActive) {
    apiRequestStore.stopOverlay();
    historyRenderOverlayActive = false;
  }
}

function cancelProgressiveInitialHistoryRender() {
  progressiveInitialHistoryToken += 1;
  progressiveInitialHistoryRunning = false;
  progressiveInitialHistoryState.value = null;
}

function getMessageLazySettings() {
  return resolveMessageLazySettings(
    systemSettingsStore.settings,
    Boolean(isMobile.value)
  );
}

function getHistoryLazyInitialCount() {
  return getMessageLazySettings().initialCount;
}

function getHistoryLazyAppendCount() {
  return getMessageLazySettings().appendCount;
}

function getHistoryLazyTopThresholdPx() {
  return getMessageLazySettings().topThresholdPx;
}

function createProgressiveInitialHistoryState(list = []) {
  if (!isPcProgressiveHistoryRender()) return null;
  if (!Array.isArray(list) || !list.length) return null;

  const strategy = getHistoryRenderStrategy();
  const appendCount = Math.max(1, getHistoryLazyAppendCount());
  const initialCount = Math.max(1, getHistoryLazyInitialCount());
  const target = messageRenderPolicy.value?.scrollTarget || {};
  const chunkCount = Math.min(appendCount, list.length);

  if (strategy === HISTORY_RENDER_STRATEGIES.pcProgressiveShared) {
    const end = Math.min(chunkCount, list.length);
    return {
      mode: "forward",
      start: 0,
      end,
      nextAfter: end,
      finalStart: 0,
      finalEnd: list.length,
      chunkSize: appendCount,
    };
  }

  if (strategy === HISTORY_RENDER_STRATEGIES.pcProgressiveSearch) {
    const targetIndex = findMessageIndexById(list, target.messageId);
    if (targetIndex < 0) return null;

    const start = clampRangeStart(
      targetIndex - Math.floor(chunkCount / 2),
      chunkCount,
      list.length
    );
    const end = Math.min(start + chunkCount, list.length);
    return {
      mode: "target-window",
      start,
      end,
      nextBefore: start,
      nextAfter: end,
      finalStart: 0,
      finalEnd: list.length,
      chunkSize: appendCount,
      growForwardNext: true,
    };
  }

  if (
    strategy === HISTORY_RENDER_STRATEGIES.pcProgressiveNormal &&
    target.type === MESSAGE_SCROLL_TARGET_TYPES.bottom
  ) {
    const finalCount = Math.min(initialCount, list.length);
    const finalStart = Math.max(list.length - finalCount, 0);
    const start = Math.max(list.length - Math.min(chunkCount, finalCount), 0);
    return {
      mode: "backward",
      start,
      end: list.length,
      nextBefore: start,
      finalStart,
      finalEnd: list.length,
      chunkSize: appendCount,
    };
  }

  return null;
}

function applyProgressiveInitialWindow(state) {
  if (!state) return false;
  const list = Array.isArray(fullHistoryMessages.value)
    ? fullHistoryMessages.value
    : [];
  const start = Math.max(0, state.start || 0);
  const end = Math.min(list.length, Math.max(start, state.end || 0));
  historyVisibleStartIndex.value = start;
  messages.value = list.slice(start, end);
  return true;
}

const hasPreviousHistoryMessages = computed(
  () =>
    pageState.isChatPage.value &&
    messageRenderPolicy.value.useLazyLoading !== false &&
    historyVisibleStartIndex.value > 0
);

function clearLazyHistoryMessages() {
  cancelProgressiveInitialHistoryRender();
  fullHistoryMessages.value = [];
  historyVisibleStartIndex.value = 0;
}

function getInitialLazyHistorySlice(sourceMessages = []) {
  const list = Array.isArray(sourceMessages) ? sourceMessages : [];
  return resolveInitialMessageLazyRange({
    messages: list,
    initialCount: getHistoryLazyInitialCount(),
    useLazyLoading: messageRenderPolicy.value.useLazyLoading !== false,
  });
}

function setHistoryMessagesForInitialRender(sourceMessages = []) {
  cancelProgressiveInitialHistoryRender();

  const list = Array.isArray(sourceMessages) ? sourceMessages : [];
  fullHistoryMessages.value = list;

  const progressiveState = createProgressiveInitialHistoryState(list);
  if (progressiveState && applyProgressiveInitialWindow(progressiveState)) {
    progressiveInitialHistoryToken += 1;
    progressiveInitialHistoryState.value = progressiveState;
    return;
  }

  const {start, visibleMessages} = getInitialLazyHistorySlice(list);
  historyVisibleStartIndex.value = start;
  messages.value = visibleMessages;
}

function syncVisibleHistoryMessagesFromFull(sourceMessages = []) {
  const list = Array.isArray(sourceMessages) ? sourceMessages : [];
  if (messageRenderPolicy.value.useLazyLoading === false) {
    fullHistoryMessages.value = list;
    historyVisibleStartIndex.value = 0;
    messages.value = list;
    return true;
  }

  if (!pageState.isChatPage.value || !fullHistoryMessages.value.length) {
    fullHistoryMessages.value = list;
    return false;
  }

  const currentVisibleCount = Math.max(
    messages.value.length,
    Math.min(getHistoryLazyInitialCount(), list.length)
  );
  const isShowingLatest =
    historyVisibleStartIndex.value + messages.value.length >=
    fullHistoryMessages.value.length;

  fullHistoryMessages.value = list;

  if (isShowingLatest) {
    const count = Math.max(currentVisibleCount, getHistoryLazyInitialCount());
    historyVisibleStartIndex.value = Math.max(list.length - count, 0);
  } else {
    historyVisibleStartIndex.value = Math.min(
      historyVisibleStartIndex.value,
      Math.max(list.length - 1, 0)
    );
  }

  const end = isShowingLatest
    ? list.length
    : Math.min(
        historyVisibleStartIndex.value + currentVisibleCount,
        list.length
      );
  messages.value = list.slice(historyVisibleStartIndex.value, end);
  return true;
}

function loadPreviousHistoryMessages() {
  if (!pageState.isChatPage.value) return false;
  if (messageRenderPolicy.value.useLazyLoading === false) return false;
  const list = fullHistoryMessages.value;
  if (!Array.isArray(list) || !list.length) return false;
  if (historyVisibleStartIndex.value <= 0) return false;

  const previousStart = historyVisibleStartIndex.value;
  const nextStart = resolvePreviousMessageLazyStart({
    currentStart: previousStart,
    appendCount: getHistoryLazyAppendCount(),
  });
  if (nextStart === previousStart) return false;

  historyVisibleStartIndex.value = nextStart;
  messages.value = list.slice(nextStart);
  return true;
}

function isLazyHistoryActiveForChat(chatId) {
  return (
    messageRenderPolicy.value.useLazyLoading !== false &&
    pageState.isChatPage.value &&
    String(activeHistoryId.value || "") === String(chatId || "") &&
    Array.isArray(fullHistoryMessages.value) &&
    fullHistoryMessages.value.length > 0
  );
}

function mergeVisibleMessagesIntoFullHistory(nextVisibleMessages = []) {
  const existing = Array.isArray(fullHistoryMessages.value)
    ? fullHistoryMessages.value
    : [];
  const start = Math.max(0, historyVisibleStartIndex.value);
  const visible = Array.isArray(nextVisibleMessages)
    ? nextVisibleMessages
    : [];

  const merged = [...existing.slice(0, start), ...visible];
  fullHistoryMessages.value = merged;
  messages.value = visible;
  return merged;
}

function setConversationPreservingLazyHistory(chatId, nextMessages) {
  if (isLazyHistoryActiveForChat(chatId)) {
    const merged = mergeVisibleMessagesIntoFullHistory(nextMessages);
    runtime.setMessages(chatId, merged);
    return;
  }

  runtime.setMessages(chatId, nextMessages);
}

function appendUserAndAssistantMessagesPreservingLazyHistory(
  chatId,
  normalized
) {
  const result = runtime.appendUserAndAssistantMessages(chatId, normalized);

  if (!isLazyHistoryActiveForChat(chatId)) {
    return result;
  }

  fullHistoryMessages.value = Array.isArray(result.messages)
    ? result.messages
    : [];

  const visibleCount = Math.max(
    getHistoryLazyInitialCount(),
    Math.min(
      fullHistoryMessages.value.length,
      (messages.value?.length || 0) + 2
    )
  );
  historyVisibleStartIndex.value = Math.max(
    fullHistoryMessages.value.length - visibleCount,
    0
  );
  const visibleMessages = fullHistoryMessages.value.slice(
    historyVisibleStartIndex.value
  );
  messages.value = visibleMessages;

  return {
    messages: visibleMessages,
    assistantMessage: result.assistantMessage,
  };
}

function expandProgressiveStateForward(state) {
  if (state.nextAfter >= state.finalEnd) return false;
  state.end = Math.min(state.nextAfter + state.chunkSize, state.finalEnd);
  state.nextAfter = state.end;
  return true;
}

function expandProgressiveStateBackward(state) {
  if (state.nextBefore <= state.finalStart) return false;
  state.start = Math.max(
    state.nextBefore - state.chunkSize,
    state.finalStart
  );
  state.nextBefore = state.start;
  return true;
}

function expandProgressiveStateTargetWindow(state) {
  if (state.growForwardNext && expandProgressiveStateForward(state)) {
    state.growForwardNext = false;
    return true;
  }
  if (expandProgressiveStateBackward(state)) {
    state.growForwardNext = true;
    return true;
  }
  if (expandProgressiveStateForward(state)) {
    state.growForwardNext = false;
    return true;
  }
  return false;
}

function expandProgressiveInitialState(state, list) {
  if (!state || !Array.isArray(list) || !list.length) return false;
  if (state.mode === "forward") return expandProgressiveStateForward(state);
  if (state.mode === "backward") return expandProgressiveStateBackward(state);
  if (state.mode === "target-window") {
    return expandProgressiveStateTargetWindow(state);
  }
  return false;
}

async function continueProgressiveInitialHistoryRender() {
  const state = progressiveInitialHistoryState.value;
  if (!state || progressiveInitialHistoryRunning) return false;

  const token = progressiveInitialHistoryToken;
  progressiveInitialHistoryRunning = true;

  try {
    const list = Array.isArray(fullHistoryMessages.value)
      ? fullHistoryMessages.value
      : [];
    while (
      token === progressiveInitialHistoryToken &&
      progressiveInitialHistoryState.value &&
      expandProgressiveInitialState(state, list)
    ) {
      applyProgressiveInitialWindow(state);
      await nextTick();
      await waitAnimationFrame();
    }

    if (token === progressiveInitialHistoryToken) {
      progressiveInitialHistoryState.value = null;
    }
    return true;
  } finally {
    if (token === progressiveInitialHistoryToken) {
      progressiveInitialHistoryRunning = false;
    }
  }
}

const activeConversationTitle = computed(() =>
  resolveConversationTitle({
    isSharedPage: pageState.isSharedPage.value,
    activeHistoryId: activeHistoryId.value,
    activeHistory: activeHistory.value,
    t,
  })
);

const workspaceAssistantLabel = computed(() =>
  resolveWorkspaceAssistantLabel({
    activeSession: activeSession.value,
    currentAssistant: currentAssistant.value,
    fallbackLabel: t("chat.assistant"),
  })
);

const suggestions = computed(() => {
  const assistantPrompts = currentExamplePrompts.value || [];
  const isEnglish = locale.value === "en";

  return assistantPrompts
    .slice(0, PROMPT_SUGGESTION_LIMIT)
    .map((prompt) => {
      const localizedTitle = isEnglish
        ? prompt.titleEn || prompt.titleKo
        : prompt.titleKo || prompt.titleEn;
      const localizedContent = isEnglish
        ? prompt.contentEn || prompt.contentKo || localizedTitle
        : prompt.contentKo || prompt.contentEn || localizedTitle;

      const text = localizedTitle || localizedContent;
      const content = localizedContent || localizedTitle;

      return {
        id: prompt.id,
        text,
        title: content || text,
        prompt: content || text,
      };
    })
    .filter((item) => item.text && item.prompt);
});

function resetMainRouteConversation() {
  finishHistoryRender();
  clearLazyHistoryMessages();
  messages.value = [];
  chatStore.pruneInactiveMessageCache(null);
  runtime.clearActiveSession();
}

async function handleMissingHistoryId({isCurrentLoad}) {
  const hasPendingChatEntryNavigation = hasPendingChatNavigation({
    chatStore,
  });

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

async function hydrateHistoryConversation({history, isCurrentLoad}) {
  chatStore.setPendingSelectedChatId(history.id);
  beginHistoryRender();
  const mermaidWarmupPromise = isMermaidRenderingEnabled()
    ? warmupMermaidForHistoryRender().catch(() => null)
    : Promise.resolve(null);

  await flushConversationSwitchPaint();
  if (!isCurrentLoad()) return;
  chatStore.pruneInactiveMessageCache(history.id);
  const loadedMessages = await runtime.ensureConversation(history.id);
  if (hasMermaidInHistoryMessages(loadedMessages)) {
    await mermaidWarmupPromise;
  }
  if (!isCurrentLoad()) return;
  setHistoryMessagesForInitialRender(loadedMessages);
  historyMessagesLoaded.value = true;
  clearPendingSelectedChatId(history.id);
  await nextTick();
  chatStore.pruneInactiveMessageCache(history.id);
}

async function loadHistoryRouteConversation({isCurrentLoad}) {
  if (pageState.isMainPage.value) {
    resetMainRouteConversation();
    return;
  }

  if (!activeHistoryId.value) {
    await handleMissingHistoryId({isCurrentLoad});
    return;
  }

  const history = findHistory(activeHistoryId.value);
  if (!history) {
    await redirectMissingHistory();
    return;
  }

  if (chatStore.consumePendingNewSubmitChat(history.id)) {
    await applyPendingNewSubmitHistory(history);
    return;
  }

  await hydrateHistoryConversation({history, isCurrentLoad});
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

async function loadSharedRouteConversation({isCurrentLoad}) {
  beginHistoryRender();
  await flushConversationSwitchPaint();
  if (!isCurrentLoad()) return;

  const sharedEntryId = getSharedEntryId();
  if (sharedEntryId) {
    const result = await getSharedConversation(sharedEntryId);
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

  const result = await getSharedConversation(activeHistoryId.value);
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

async function loadRouteConversation() {
  const loadSeq = ++routeConversationLoadSeq;
  const isCurrentLoad = () => loadSeq === routeConversationLoadSeq;

  try {
    if (pageState.isSharedPage.value) {
      await loadSharedRouteConversation({isCurrentLoad});
      return;
    }

    await loadHistoryRouteConversation({isCurrentLoad});
  } catch (error) {
    if (isCurrentLoad()) {
      if (pageState.isSharedPage.value) {
        await redirectSharedNotFound({
          message: error?.message || t("chat.sharedNotFoundMessage"),
        });
        return;
      }
      clearPendingSelectedChatId(activeHistoryId.value);
      finishHistoryRender();
    }
    logWarn("[ChatContainer] loadRouteConversation 오류:", error);
  }
}

function invalidateRouteLoad() {
  routeConversationLoadSeq += 1;
}

function shouldLoadRouteConversation() {
  return pageState.isMainPage.value || pageState.isConversationPage.value;
}

const {isGenerating, submit, regenerate} = useChatSubmit({
  histories,
  messages,
  createRemoteConversation: runtime.createRemoteConversation,
  createLocalConversation: runtime.createLocalConversation,
  appendUserAndAssistantMessages:
    appendUserAndAssistantMessagesPreservingLazyHistory,
  setConversation: setConversationPreservingLazyHistory,
  selectedAssistantId,
  selectedModel,
  models,
  scrollBottom: async (options = {}) => {
    if (options.autoAnswer && !autoScrollOnAnswer.value) return;
    if (options.autoAnswer) markForceBottom(2500);
    await scrollBottom(options);
  },
  scrollLatestUserMessage,
  autoScrollOnAnswer,
  syncHistories: () => runtime.syncHistoriesInBackground({notifyOnError: true}),
  renderAfterStream,
  canWrite: () =>
    !isReadOnly.value &&
    !isHistoryRendering.value &&
    !navigationLock.isChatHistoryLocked.value &&
    !isActiveModelUnavailable.value,
  isReadOnly,
  isActiveModelUnavailable,
  markNewSubmitConversation: chatStore.markPendingNewSubmitChat.bind(chatStore),
});

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
      chatStore.activeRoomId,
      chatStore.activeRoomType,
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
    updateMobileState();
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

const historyLazyTopThreshold = computed(() => getHistoryLazyTopThresholdPx());
const historyLazyChunkSize = computed(() => getHistoryLazyAppendCount());
const pcHistoryLazyInitialCount = computed(
  () => systemSettingsStore.pcHistoryLazyInitialCount
);
const pcHistoryLazyAppendCount = computed(
  () => systemSettingsStore.pcHistoryLazyAppendCount
);
const pcHistoryLazyTopThresholdPx = computed(
  () => systemSettingsStore.pcHistoryLazyTopThresholdPx
);
const mobileHistoryLazyInitialCount = computed(
  () => systemSettingsStore.mobileHistoryLazyInitialCount
);
const mobileHistoryLazyAppendCount = computed(
  () => systemSettingsStore.mobileHistoryLazyAppendCount
);

watch(pageState.isMainPage, updateMobileState);
watch(() => pageState.isConversationPage.value, updateMobileState);
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

const showVirtualKeyboardDebugButton = computed(
  () => isMobile.value && showVirtualKeyboardDebug.value
);

const isChatContainerHistoryBusy = computed(
  () => isChatHistoryLocked.value || toLockValue(isHistoryRendering)
);
const isConversationActionBlocked = computed(
  () =>
    isGlobalLocked.value ||
    isStreamingLocked.value ||
    isChatContainerHistoryBusy.value
);
const chatPageLock = {
  isConversationActionBlocked,
  isSubmitBlocked: computed(
    () =>
      isConversationActionBlocked.value ||
      chatStreamStore.isStreaming ||
      toLockValue(isReadOnly) ||
      toLockValue(isGenerating) ||
      toLockValue(isActiveModelUnavailable)
  ),
  isRegenerateBlocked: computed(
    () =>
      isConversationActionBlocked.value ||
      toLockValue(isReadOnly) ||
      toLockValue(isGenerating)
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

function isDeletedRuntimeStudioAssistant(assistant = null) {
  const id = String(assistant?.id || "").trim();
  return Boolean(
    id &&
      isStudioAssistant(assistant) &&
      studioRuntimeStore.isStudioDeleted(id)
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
  releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
  closeStudioDetail();

  if (route.name === ROUTE_NAMES.MAIN) {
    const fallback = findFirstFallbackAssistant();
    if (fallback?.id) assistantStore.selectAssistant(fallback.id);
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
  cleanupAfterPortalConversationNavigation(createPortalNavigationResetContext());
}

async function openPortalAssistant(assistantId) {
  const targetRoute = createPortalAssistantRoute(assistantId);

  preparePortalNavigation();
  assistantStore.selectAssistant(assistantId);
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
  const routePortalAssistantId = getPortalAssistantIdByRouteName(route.name);

  if (routePortalAssistantId) {
    const portalAssistant = assistantStore.assistantMap[routePortalAssistantId];
    if (
      portalAssistant &&
      assistantStore.selectedAssistantId !== routePortalAssistantId
    ) {
      assistantStore.selectAssistant(routePortalAssistantId);
    }
    return;
  }

  if (isPortalAssistantId(assistantStore.selectedAssistantId)) {
    const fallbackAssistant = findFirstNormalAssistant();
    if (fallbackAssistant) assistantStore.selectAssistant(fallbackAssistant.id);
  }
}

watch(
  [() => route.name, () => assistantStore.assistants.length],
  syncAssistantSelectionWithRoute,
  {immediate: true}
);

/**
 * 사용자 이벤트 또는 하위 컴포넌트 emit을 받아 필요한 상태 변경/action을 실행합니다.
 */
function setWorkspaceRef(el) {
  workspaceRef.value = el;
}

provide(CHAT_ACTIONS_KEY, {
  historyMenuAction: handleHistoryMenuAction,
});

provide(
  CHAT_WORKSPACE_STATE_KEY,
  computed(() => ({
    mode: routeMode.value,
    readonly: isReadOnly.value,
    isMobile: isMobile.value,
    assistantLabel: workspaceAssistantLabel.value,
    assistant: currentAssistant.value,
    conversationTitle: activeConversationTitle.value,
    themeName: themeName.value,
    suggestions: suggestions.value,
    isActiveModelDeleted: Boolean(chatStore.activeSession?.isModelDeleted),
    isActiveModelUnavailable: isActiveModelUnavailable.value,
    isGenerating: isGenerating.value,
    messages: messages.value,
    showScrollBottom: showScrollBottom.value,
    autoScrollOnAnswer: autoScrollOnAnswer.value,
    isHistoryRendering: isHistoryRendering.value,
    historyMarkdownVisible: historyMarkdownVisible.value,
    historyMessagesLoaded: historyMessagesLoaded.value,
    hasPreviousHistoryMessages: hasPreviousHistoryMessages.value,
    historyLazyTopThreshold: historyLazyTopThreshold.value,
    historyLazyChunkSize: historyLazyChunkSize.value,
    messageRenderPolicy: messageRenderPolicy.value,
    pcHistoryLazyInitialCount: pcHistoryLazyInitialCount.value,
    pcHistoryLazyAppendCount: pcHistoryLazyAppendCount.value,
    pcHistoryLazyTopThresholdPx: pcHistoryLazyTopThresholdPx.value,
    mobileHistoryLazyInitialCount: mobileHistoryLazyInitialCount.value,
    mobileHistoryLazyAppendCount: mobileHistoryLazyAppendCount.value,
  }))
);

provide(
  PROMPT_STATE_KEY,
  computed(() => ({
    isMobile: isMobile.value,
    floating: false,
    showHelp: false,
    selectedModel: selectedModel.value,
    models: models.value,
    disabled: isReadOnly.value,
    generating: isGenerating.value,
    modelReadonly: isModelLocked.value,
    placeholder: "",
  }))
);

provide(WORKSPACE_ACTIONS_KEY, {
  submit: (payload) => {
    if (chatPageLock.isSubmitBlocked.value) return;
    submit(payload);
  },
  regenerate: (message) => {
    if (chatPageLock.isRegenerateBlocked.value) return;
    regenerate(message);
  },
  updateSelectedModel: (val) => {
    selectedModel.value = val;
  },
  handlePromptFocus: refreshPromptViewport,
  handlePromptResize: refreshPromptViewport,
  handleMessageContentRendered,
  scrollBottom: () => {
    scrollBottom({force: true, behavior: "smooth", stable: true});
  },
  handleHistoryRendered: finishHistoryRender,
  handleHistoryMarkdownRendered: revealHistoryMarkdown,
  continueProgressiveInitialHistoryRender,
  loadPreviousHistoryMessages,
  openStudioDetail,
});
</script>

<style scoped lang="scss">
.chat-container-root {
  min-width: 0;
  min-height: 0;
}
</style>
