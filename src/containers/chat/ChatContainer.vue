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
  onMounted,
  ref,
  watch,
} from "vue";
import {useEventListener} from "@vueuse/core";
import {IMAGE_PREVIEW_EVENT} from "@/constants/promptComposer";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useRoute, useRouter} from "vue-router";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {ASSISTANT_PORTAL_IDS, isPortalAssistantId} from "@/constants/assistantPortal";
import {CHAT_ROUTE_NAMES, ROUTE_NAMES, SHARED_ROUTE_NAMES, STUDIO_ROUTE_NAMES} from "@/constants/routeNames";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";
import {createId} from "@/utils/id";
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
import {usePromptControlStore} from "@/stores/promptControlStore";
import {useAppBootstrap} from "@/composables/app/useAppBootstrap";
import {notifyChatHistorySyncFailed} from "@/utils/chatHistoryErrorNotifier";
import {resolveChatApis} from "@/api/runtime/chatApis";
import {adaptChatHistoryItem, adaptChatHistoryList} from "@/adapters/chatResponseAdapter";
import {adaptExamplePromptList} from "@/adapters/promptAdapter";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAppShellStore} from "@/stores/appShellStore";
import {useViewportGuard} from "@/platform/viewport/useViewportGuard";
import {syncMobileViewportSettings} from "@/utils/syncMobileViewportSettings";
import {
  configureResponseOverlay,
  setupResponseOverlayBackGuard,
} from "@/composables/overlay/responseOverlayActions";
import {useOverlayBackClose} from "@/composables/overlay/useOverlayBackClose";

import {deleteStudio} from "@/services/studioDetailService";
import {
  isStudioAssistant,
  normalizeStudioDetail,
} from "@/composables/studio/useStudioDetailModel";
import {provideNavigationActions} from "@/composables/navigation/context/navigationActionContext";
import {provideStudioDetailActions} from "@/composables/studio/context/studioDetailActionContext";


function markSessionAsMissingAssistant(
  session = {},
  assistantId = "",
  assistantLabel = "",
  assistantType = "studio"
) {
  const deletedAssistantId = String(assistantId || session?.assistantId || "").trim();
  const deletedAssistantLabel =
    [session?.displayAssistantLabel, session?.assistantLabel, assistantLabel]
      .map((value) => String(value || "").trim())
      .find(Boolean) || "";

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

function getPreviewSources(detail = {}) {
  return [detail.dataUrl, detail.previewUrl, detail.url]
    .filter((url) => typeof url === "string" && url.length > 0)
    .filter((url, index, array) => array.indexOf(url) === index);
}

function readPreviewDataUrl(file) {
  return new Promise((resolve) => {
    if (!file || typeof FileReader === "undefined") return resolve("");
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

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
const promptControlStore = usePromptControlStore();
const studioRuntimeStore = useStudioRuntimeStore();
const appBootstrap = useAppBootstrap();
const {
  assistants: assistantListRef,
  selectedAssist: selectedAssistRef,
  selectedModel: selectedModelRef,
} = storeToRefs(chatStore);
// 템플릿에서는 기존 prop 이름을 그대로 사용하므로 ref alias를 명시합니다.
const selectedAssistantId = selectedAssistRef;

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
    const {chatHistoryApi} = resolveChatApis();
    const rawHistories = await chatHistoryApi.getChatHistoryList();
    const chatHistories = adaptChatHistoryList(rawHistories, {
      assistantMap: chatStore.assistantMap,
      modelMap: chatStore.modelMap,
    });
    chatStore.setChatRooms(chatHistories);
    return chatHistories;
  } catch (error) {
    if (notifyOnError) await notifyChatHistorySyncFailed(error);
    return chatStore.chatRooms;
  }
}

function syncHistoriesInBackground(options = {}) {
  return Promise.resolve()
    .then(() => refreshHistories(options))
    .catch((error) => {
      void error;
      return chatStore.chatRooms;
    });
}

async function toggleHistoryBookmark(history) {
  if (!history?.chatId) return;
  syncHistoriesInBackground({notifyOnError: true});
  const {chatHistoryApi} = resolveChatApis();
  await chatHistoryApi.updateBookmark({
    chatId: history.chatId,
    bookmarkYN: !history.isPinned,
  });
  syncHistoriesInBackground({notifyOnError: true});
}

async function renameHistory(history, title) {
  const chatTitle = String(title || "").trim();
  if (!history?.chatId || !chatTitle) return;
  syncHistoriesInBackground({notifyOnError: true});
  const {chatHistoryApi} = resolveChatApis();
  await chatHistoryApi.renameChat({chatId: history.chatId, chatTitle});
  syncHistoriesInBackground({notifyOnError: true});
}

async function removeHistory(history) {
  if (!history?.chatId) return;
  syncHistoriesInBackground({notifyOnError: true});
  const {chatHistoryApi} = resolveChatApis();
  await chatHistoryApi.deleteChat({chatId: history.chatId});
  if (String(chatStore.selectedChatId) === String(history.chatId)) {
    chatStore.clearSelectedChatState();
  }
  syncHistoriesInBackground({notifyOnError: true});
}
const currentMode = computed(() => {
  if (SHARED_ROUTE_NAMES.includes(route.name)) return "shared";
  if (STUDIO_ROUTE_NAMES.includes(route.name)) return "studio";
  if (route.name === ROUTE_NAMES.CHAT_SEARCH) return "chat-search";
  if (CHAT_ROUTE_NAMES.includes(route.name)) return "chat";
  return "main";
});
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

const routeMode = computed(() => {
  if (pageState.isReadOnly.value) return "shared";

  const workspaceType = activeWorkspaceType.value;
  if (workspaceType === WORKSPACE_TYPES.CONVERSATION) return "chat";
  if (workspaceType === WORKSPACE_TYPES.MAIN) return "main";
  if (workspaceType === WORKSPACE_TYPES.STUDIO) return "studio";
  if (workspaceType === WORKSPACE_TYPES.MCP) return "mcp";
  if (workspaceType === WORKSPACE_TYPES.CHAT_SEARCH) return "chat-search";

  return currentMode.value;
});

const activeHistoryId = computed(() => {
  if (route.name === ROUTE_NAMES.SHARE_CHAT_ENTRY) {
    return String(route.params?.id || "").trim() || null;
  }

  if (pageState.isChatPage.value) {
    return chatStore.selectedChatId || null;
  }
  if (pageState.isSharedPage.value) {
    return String(
      chatStore.selectedChatInfo?.sharedId ||
        chatStore.selectedChatInfo?.chatId ||
        route.params?.id ||
        route.params?.shareId ||
        ""
    ).trim();
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
const runtimeIsActiveModelUnavailable = computed(() =>
  Boolean(chatStore.selectedChatInfo?.isModelUnavailable)
);
const runtimeIsModelLocked = computed(
  () => chatStore.isModelLocked || pageState.isConversationPage.value
);
const runtimeSelectedModel = computed({
  get: () => chatStore.selectedChatInfo?.modelId || selectedModelRef.value,
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
    const {examplePromptApi} = resolveChatApis();
    const response = await examplePromptApi.getExamplePrompts({
      assistId: assistantId,
      studioYN: assistant?.type === "studio",
    });
    chatStore.setExamplePrompts(assistantId, adaptExamplePromptList(response));
  } catch (error) {
    void error;
  }
}

async function selectRuntimeAssistant(id, {forNewChat = false} = {}) {
  if (!forNewChat && runtimeIsModelLocked.value) return;
  if (!chatStore.assistantMap[id]) return;
  try {
    await preloadRuntimeExamplePrompts(id);
    chatStore.selectAssistant(id);
    if (forNewChat) chatStore.clearSelectedChatState();
  } catch (error) {
    void error;
  }
}

const assistants = assistantListRef;
const currentAssistant = runtimeCurrentAssistant;
const selectedModel = runtimeSelectedModel;
const isActiveModelUnavailable = runtimeIsActiveModelUnavailable;

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
const previewImage = ref(null);

async function hydrateOpenPreviewFromFile(targetPreview) {
  const dataUrl = await readPreviewDataUrl(targetPreview?.file);
  if (!dataUrl || previewImage.value?.id !== targetPreview.id) return;
  previewImage.value = {
    ...previewImage.value,
    dataUrl,
    url: dataUrl,
    sources: [dataUrl, ...(previewImage.value.sources || [])].filter(
      (url, index, array) => url && array.indexOf(url) === index
    ),
    loading: true,
    error: false,
  };
}

function openImagePreview(event) {
  const detail = event?.detail || {};
  const sources = getPreviewSources(detail);
  const firstUrl = sources[0] || "";
  previewImage.value = {
    ...detail,
    url: firstUrl,
    sources,
    sourceIndex: 0,
    loading: Boolean(firstUrl || detail.file),
    error: !firstUrl && !detail.file,
  };
  if (detail.file && !detail.dataUrl) {
    hydrateOpenPreviewFromFile({...detail, id: previewImage.value.id});
  }
}

function handlePreviewLoad() {
  if (!previewImage.value) return;
  previewImage.value.loading = false;
  previewImage.value.error = false;
}

async function handlePreviewError() {
  const current = previewImage.value;
  if (!current) return;
  const nextIndex = Number(current.sourceIndex || 0) + 1;
  const nextUrl = current.sources?.[nextIndex];
  if (nextUrl) {
    previewImage.value = {
      ...current,
      url: nextUrl,
      sourceIndex: nextIndex,
      loading: true,
      error: false,
    };
    return;
  }
  const dataUrl = await readPreviewDataUrl(current.file);
  if (dataUrl && previewImage.value?.id === current.id) {
    previewImage.value = {
      ...previewImage.value,
      dataUrl,
      url: dataUrl,
      sources: [dataUrl],
      sourceIndex: 0,
      loading: true,
      error: false,
    };
    return;
  }
  if (previewImage.value?.id === current.id) {
    previewImage.value.loading = false;
    previewImage.value.error = true;
  }
}

function closeImagePreview() {
  previewImage.value = null;
}

useEventListener(window, IMAGE_PREVIEW_EVENT, openImagePreview);

const isMobile = computed(() => true);

configureResponseOverlay({
  isMobile,
  shouldSuppressChatRouteLoad: computed(() =>
    Boolean(pageState.isChatPage?.value)
  ),
  suppressChatRouteLoadId: activeHistoryId,
});
setupResponseOverlayBackGuard();

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

const historyDialogShareUrl = computed(() => {
  const history = historyDialogTarget.value;
  const chatId = String(
    history?.chatId || history?.raw?.chatId || history?.sharedId || ""
  ).trim();
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
      await renameHistory(target, nextTitle);
      return;
    }

    if (historyDialogMode.value === "delete") {
      await removeHistory(target);

      if (String(activeHistoryId.value) === String(target.chatId)) {
        await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
      }
      return;
    }

    if (historyDialogMode.value === "share") {
      syncHistoriesInBackground({notifyOnError: true});
    }
  } catch (error) {
    void error;
  } finally {
    closeHistoryDialog();
  }
}

async function handleHistoryMenuAction({action, history} = {}) {
  if (chatStore.isWait) return;
  if (!history || !action) return;

  syncHistoriesInBackground({notifyOnError: true});

  if (action === "pin" || action === "unpin") {
    try {
      await toggleHistoryBookmark(history);
    } catch (error) {
      void error;
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
  if (pageState.isReadOnly.value || isActiveModelUnavailable.value) {
    return;
  }

  refreshViewport();
}

function clearConversationNavigationState() {
  chatStore.setSelectedChatSearchInfo(null);
  chatStore.clearSelectedChatState();
  cleanupConversationForNavigation();
}

async function navigateToMainAfterReset() {
  clearConversationNavigationState();
  await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
}

async function resetChatState({assistantId = null} = {}) {
  if (chatStore.isWait) return;

  clearConversationNavigationState();

  if (assistantId) {
    try {
      await selectRuntimeAssistant(assistantId, {forNewChat: true});
    } catch (error) {
      void error;
    }
    assistantSheetOpen.value = false;
  }

  appShellStore.closeTransientShellPanels();
  await navigateToMainAfterReset();
}

const startNewChat = resetChatState;

function handleRuntimeOverlayApplied() {
  syncMobileViewportSettings();
  refreshViewport();
}

function cleanupConversationForNavigation() {
  return null;
}

const runtimeReady = ref(false);

const isGenerating = computed(() => chatStore.isWait);
const isReadOnly = computed(() => pageState.isReadOnly.value || chatStore.isActiveSharedRoom);
onMounted(async () => {
  try {
    await initializeRuntime();
  } catch (error) {
    void error;
  } finally {
    runtimeReady.value = true;
  }
});

const shellReady = computed(
  () => runtimeReady.value || appRuntimeStore.initialized
);

const isConversationActionBlocked = computed(() => chatStore.isWait);
const chatPageLock = {
  isConversationActionBlocked,
  isSubmitBlocked: computed(
    () =>
      isConversationActionBlocked.value ||
      chatStore.isWait ||
      isReadOnly.value ||
      isGenerating.value ||
      isActiveModelUnavailable.value
  ),
  isRegenerateBlocked: computed(
    () =>
      isConversationActionBlocked.value ||
      isReadOnly.value ||
      isGenerating.value
  ),
};

const isStudioDetailBlocked = computed(
  () =>
    chatPageLock.isConversationActionBlocked.value ||
    isGenerating.value
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
    const nextAssistant = findFirstNormalAssistant();
    if (nextAssistant?.id) chatStore.selectAssistant(nextAssistant.id);
    chatStore.clearSelectedChatState();
    return;
  }

  if (
    route.name === ROUTE_NAMES.CHAT_DETAIL ||
    route.name === ROUTE_NAMES.CHAT_ENTRY
  ) {
    const currentSession = chatStore.selectedChatInfo || {};
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

    const missingAssistantSession = markSessionAsMissingAssistant(
      {
        ...currentSession,
        chatId: currentSession.chatId || chatStore.selectedChatId,
      },
      deletedStudioId,
      deletedStudioLabel,
      "studio"
    );
    chatStore.setSelectedChatId(missingAssistantSession.chatId || chatStore.selectedChatId);
    chatStore.setSelectedChatInfo(missingAssistantSession);
  }
}

const PORTAL_ROUTE_BY_ASSISTANT_ID = Object.freeze({
  [ASSISTANT_PORTAL_IDS.STUDIO]: ROUTE_NAMES.STUDIO,
  [ASSISTANT_PORTAL_IDS.CONNECTOR_STORE]: ROUTE_NAMES.CONNECTOR_STORE,
});

const PORTAL_ASSISTANT_ID_BY_ROUTE_NAME = Object.freeze({
  [ROUTE_NAMES.STUDIO]: ASSISTANT_PORTAL_IDS.STUDIO,
  [ROUTE_NAMES.CONNECTOR_STORE]: ASSISTANT_PORTAL_IDS.CONNECTOR_STORE,
});

function createPortalAssistantRoute(assistantId) {
  return {
    name:
      PORTAL_ROUTE_BY_ASSISTANT_ID[String(assistantId || "").trim()] ||
      ROUTE_NAMES.STUDIO,
  };
}

function getPortalAssistantIdByRouteName(routeName) {
  return PORTAL_ASSISTANT_ID_BY_ROUTE_NAME[String(routeName || "").trim()] || "";
}

function preparePortalNavigation() {
  chatStore.setSelectedChatSearchInfo(null);
  appShellStore.closeTransientShellPanels();
}

function cleanupAfterPortalNavigation() {
  chatStore.clearSelectedChatState();
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
      !isDeletedRuntimeStudioAssistant(assistant) &&
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
      chatStore.selectedAssist !== routePortalAssistantId
    ) {
      chatStore.selectAssistant(routePortalAssistantId);
    }
    return;
  }

  if (isPortalAssistantId(chatStore.selectedAssist)) {
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

async function createConversationFromInput(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const text = payload?.text || "";
  const chatId = createId();
  const rawHistory = await chatHistoryApi.createChat({
    chatId,
    assistId: chatStore.getSelectedAssistId(),
    modelId: chatStore.getSelectedModelId(),
    ChatTilte: String(text || "새 대화").slice(0, 20),
    studio: Boolean(chatStore.selectedAssistInfo?.studioYN),
  });
  const history = adaptChatHistoryItem(rawHistory, {
    assistantMap: chatStore.assistantMap,
    modelMap: chatStore.modelMap,
  });
  const nextHistory = {
    ...history,
    chatId: history.chatId || chatId,
    title: history.title || String(text || "새 대화").slice(0, 20),
    roomType: ACTIVE_ROOM_TYPES.chat,
  };

  chatStore.addHistory(nextHistory);
  promptControlStore.promoteDraftPromptToolSettingsToChat(nextHistory.chatId);
  chatStore.setSelectedChatId(nextHistory.chatId);
  chatStore.setSelectedChatInfo(nextHistory);

  return nextHistory;
}

async function handleWorkspaceSubmit(payload) {
  if (chatPageLock.isSubmitBlocked.value) return;
  if (route.name !== ROUTE_NAMES.MAIN) return;
  if (!payload?.text && !payload?.attachments?.length) return;

  try {
    const history = await createConversationFromInput(payload);
    await router.push({name: ROUTE_NAMES.CHAT_ENTRY});
    chatStore.initSelectChatInfo(payload.text, history.chatId, createId());
  } catch (error) {
    chatStore.clearInputChat();
    chatStore.setGenerateMsgId(null);
  }
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
