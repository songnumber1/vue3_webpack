<template>
  <div v-show="visible" class="message-list-shell">
    <section
      ref="scrollRef"
      class="message-list"
      :class="{
        'message-list--history-rendering':
          historyRendering && !historyMarkdownVisible,
        'message-list--manual-stream': loading,
      }"
      :inert="historyRendering && !historyMarkdownVisible ? '' : null"
      aria-live="polite"
      :aria-busy="historyRendering ? 'true' : 'false'"
      @scroll.passive="handleScroll"
      @touchstart.passive="handleUserScrollIntent"
      @wheel.passive="handleUserScrollIntent"
      @pointerdown.passive="handleUserScrollIntent"
    >
      <div
        v-for="(sector, sectorIndex) in messageTurnSectors"
        :key="sector.id"
        class="message-turn-sector"
        :class="{
          'message-turn-sector--last':
            shouldApplyLastTurnSectorMinHeight(sectorIndex),
        }"
        :style="getTurnSectorStyle(sectorIndex)"
      >
        <template v-for="message in sector.messages" :key="message.id">
          <ChatUser
            v-if="message.role === 'user'"
            :data-message-id="String(message.id || '')"
            :data-message-role="message.role"
            :message="message"
            @rendered="handleMessageRendered"
          />
          <AssistantErrorMessage
            v-else-if="isAssistantErrorMessage(message)"
            :data-message-id="String(message.id || '')"
            :data-message-role="message.role"
            :message="message"
            @rendered="handleMessageRendered"
          />
          <ChatResponse
            v-else
            :data-message-id="String(message.id || '')"
            :data-message-role="message.role"
            :message="message"
            :show-regenerate="!readonly && isLastChatResponse(message)"
            @rendered="handleMessageRendered"
            @regenerate="regenerate"
          />
        </template>
      </div>
      <div v-if="loading" class="typing-row">
        <span></span><span></span><span></span>
      </div>
      <div
        v-if="streamFocusSpacerHeight > 0"
        class="stream-focus-spacer"
        :style="{height: `${streamFocusSpacerHeight}px`}"
        aria-hidden="true"
      ></div>
      <div ref="bottomRef" class="message-list-anchor" aria-hidden="true"></div>
    </section>
  </div>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import ChatUser from "@/components/chat/ChatUser.vue";
import ChatResponse from "@/components/chat/ChatResponse.vue";
import AssistantErrorMessage from "@/components/chat/AssistantErrorMessage.vue";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/platform/scroll/overlayScrollbarController";
import {waitAnimationFrames} from "@/utils/frameScheduler";
import {
  findMessageElementById,
  getElementOffsetTopWithinScroll,
  getFirstMessageElement,
} from "@/composables/chat/internal/message-list/messageListDomUtils";
import {
  applyWindowFallbackScroll,
  getScrollableAncestors,
  isAndroidHistoryRenderRuntime,
  isAssistantErrorMessage,
  scrollElementToTarget,
} from "@/composables/chat/internal/message-list/messageListScrollUtils";
import {MESSAGE_SCROLL_TARGET_TYPES} from "@/composables/chat/internal/message-list/messageRenderPolicyTypes";
import {
  BOTTOM_THRESHOLD,
  HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES,
  HISTORY_RENDER_ANDROID_LAYOUT_MAX_FRAMES,
  HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES,
  HISTORY_RENDER_DOM_READY_MAX_FRAMES,
  HISTORY_RENDER_LAYOUT_MAX_FRAMES,
  HISTORY_RENDER_LAYOUT_STABLE_FRAMES,
  HISTORY_RENDER_READY_STABLE_FRAMES,
  KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS,
  RESIZE_RECALCULATE_DEBOUNCE_MS,
  STABLE_SCROLL_DELAYS,
} from "@/composables/chat/internal/message-list/messageListScrollConstants";
import {useAppBootstrap} from "@/composables/app/useAppBootstrap";
import {ROUTE_NAMES, resolveRouteMode} from "@/constants/routeNames";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import {useChatStore} from "@/stores/chatStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useOverlayStore} from "@/stores/overlayStore";
import {createChatHistory, loadChatHistoryList, loadChatMessageRouters, loadGenerationErrorMessages} from "@/composables/chat/runtime/chatRuntimeApi";
import {createLocalHistory, createSessionFromHistory} from "@/composables/chat/runtime/chatSessionFactory";
import {resolveConversationSessionState} from "@/composables/chat/internal/policy/chatSessionPolicy";
import {resolveActiveChatId, resolveHiddenConversationRoute, hasPendingChatNavigation} from "@/composables/chat/chatRoomActions";
import {isSharedChat, resolveMessageRenderPolicy} from "@/composables/chat/internal/message-list/useMessageRenderPolicy";
import {isProgressAllowedForCurrentPlatform} from "@/constants/chatRuntimePolicy";
import {logWarn} from "@/utils/logger";
import {logPlatformDebug} from "@/platform/platformDebug";
import {createId} from "@/utils/id";
import {adaptChatHistoryItem as adaptChatHistory} from "@/adapters/chatResponseAdapter";
import {DEFAULT_API_BASE_PATH, SERVER_API_BASE_URL, shouldUseServerApi} from "@/constants/apiMode";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {normalizeChatId} from "@/utils/normalize";
import {appendUserAndChatResponses as appendMessagesToChat, createChatResponse, createChatResponseCommitter, createAssistantStreamingPatch} from "@/composables/chat/chatMessageActions";
import {enterNewSubmitChatRoom} from "@/composables/chat/chatRoomActions";
import {GENERATION_ERROR_TEST_MODEL_ID, isGenerationErrorTestChat} from "@/constants/generationErrorTest";
import {getSharedConversation} from "@/composables/chat/useSharedChat";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {SSE} from "@/api/sse/vendor/sse";
import {resolveSessionAuthConfig} from "@/auth/authPolicy";
import {resetAuthStateSafely} from "@/auth/httpAuthInterceptor";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {API_KEYS, resolveApiPolicy} from "@/constants/apiConfig";
import {resolveStreamRuntimeType} from "@/platform/runtime/runtimeDetector";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";
import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";
import {unwrapApiBody} from "@/utils/apiResponseReader";

const componentProps = defineProps({
  visible: {type: Boolean, default: true},
});
const emit = defineEmits(["content-rendered", "history-rendered"]);

const visible = computed(() => componentProps.visible);

const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const appBootstrap = useAppBootstrap();
const studioRuntimeStore = useStudioRuntimeStore();
const chatStore = useChatStore();
const apiRequestStore = useApiRequestStore();
const overlayBackStore = useOverlayStore();
const promptControlStore = usePromptControlStore();
const {histories} = storeToRefs(chatStore);

function createAbortError(reason) {
  if (typeof DOMException !== "undefined") {
    return new DOMException(reason || "Aborted", "AbortError");
  }

  const error = new Error(reason || "Aborted");
  error.name = "AbortError";
  return error;
}

function isGenerationAbortError(error) {
  const message = String(error?.message || error || "");
  return (
    error?.name === "AbortError" ||
    error?.code === 20 ||
    /aborted|abort|page lifecycle ended|page lifecycle frozen|mobile page hidden|mobile page frozen|mobile page unloading|android app pause|ERR_CONNECTION_ABORTED|network error|networkerror|failed to fetch|load failed/i.test(
      message
    )
  );
}

function createChunkCommitter(onChunk) {
  let latestValue = "";
  let committedValue = "";
  let scheduled = false;
  let chain = Promise.resolve();

  const run = async () => {
    scheduled = false;

    if (!latestValue || latestValue === committedValue) return;

    const valueToCommit = latestValue;
    committedValue = valueToCommit;

    await onChunk?.(valueToCommit);

    if (latestValue !== committedValue) schedule();
  };

  function schedule() {
    if (scheduled) return chain;

    scheduled = true;
    chain = chain.catch(() => {}).then(run);
    return chain;
  }

  function update(value) {
    latestValue = value || "";
    return schedule();
  }

  async function flush(value) {
    if (typeof value === "string") latestValue = value;

    scheduled = false;
    await chain.catch(() => {});

    if (latestValue && latestValue !== committedValue) {
      const valueToCommit = latestValue;
      committedValue = valueToCommit;
      await onChunk?.(valueToCommit);
    }
  }

  return {update, flush};
}


function abortGenerationController(controller, reason) {
  if (!controller || controller.signal?.aborted) return;

  const abortReason = createAbortError(reason);
  try {
    controller.abort(abortReason);
  } catch (_error) {
    controller.abort();
  }
}

function createMobileBrowserSseLifecycle() {
  return {
    install({controller}) {
      if (typeof window === "undefined") return () => {};

      const handlePageEnd = () => {
        abortGenerationController(controller, "mobile browser lifecycle ended");
      };

      window.addEventListener("pagehide", handlePageEnd, {capture: true});
      window.addEventListener("beforeunload", handlePageEnd, {capture: true});

      return () => {
        window.removeEventListener("pagehide", handlePageEnd, {capture: true});
        window.removeEventListener("beforeunload", handlePageEnd, {capture: true});
      };
    },

    onAccumulated({accumulated, committer}) {
      committer.update(accumulated);
    },
  };
}

function createAndroidWebViewSseLifecycle() {
  let paused = false;
  let backlogPending = false;

  return {
    install({flush}) {
      if (typeof window === "undefined") return () => {};

      const handlePause = () => {
        paused = true;
        backlogPending = true;
      };

      const handleResume = () => {
        paused = false;
        if (backlogPending) {
          backlogPending = false;
          flush?.();
        }
      };

      window.addEventListener("apppause", handlePause, {capture: true});
      window.addEventListener("appresume", handleResume, {capture: true});

      return () => {
        window.removeEventListener("apppause", handlePause, {capture: true});
        window.removeEventListener("appresume", handleResume, {capture: true});
      };
    },

    onAccumulated({accumulated, committer}) {
      if (paused) backlogPending = true;
      committer.update(accumulated);
    },
  };
}

function createChromeSseLifecycle() {
  const abortOnBackground = true;
  let hiddenBacklogPending = false;
  let pendingResumeAlert = false;
  let resumeAlertCleanup = null;

  const isDocumentHidden = () =>
    typeof document !== "undefined" && document.hidden;

  const clearResumeAlertListeners = () => {
    if (typeof resumeAlertCleanup === "function") resumeAlertCleanup();
    resumeAlertCleanup = null;
  };

  const showResumeAlert = () => {
    if (!pendingResumeAlert || isDocumentHidden()) return;

    pendingResumeAlert = false;
    clearResumeAlertListeners();

    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(t("chat.lifecycle.mobileBackgroundAbortResumeAlert"));
    }
  };

  const scheduleResumeAlert = () => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    pendingResumeAlert = true;
    clearResumeAlertListeners();

    const handleResume = () => showResumeAlert();

    document.addEventListener("visibilitychange", handleResume, {capture: true});
    window.addEventListener("pageshow", handleResume, {capture: true});
    window.addEventListener("focus", handleResume, {capture: true});

    resumeAlertCleanup = () => {
      document.removeEventListener("visibilitychange", handleResume, {
        capture: true,
      });
      window.removeEventListener("pageshow", handleResume, {capture: true});
      window.removeEventListener("focus", handleResume, {capture: true});
    };
  };

  return {
    install({controller, flush}) {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return () => {};
      }

      const abortForBackground = (reason) => {
        if (!abortOnBackground) return;
        scheduleResumeAlert();
        abortGenerationController(controller, reason);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          hiddenBacklogPending = true;
          abortForBackground("mobile page hidden");
          return;
        }

        if (hiddenBacklogPending) {
          hiddenBacklogPending = false;
          flush?.();
        }
      };

      const handlePageHide = () => abortForBackground("mobile page hidden");
      const handleFreeze = () => abortForBackground("mobile page frozen");

      const handleFocus = () => {
        if (!isDocumentHidden() && hiddenBacklogPending) {
          hiddenBacklogPending = false;
          flush?.();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange, {
        capture: true,
      });
      window.addEventListener("pagehide", handlePageHide, {capture: true});
      window.addEventListener("freeze", handleFreeze, {capture: true});
      window.addEventListener("pageshow", handleFocus, {capture: true});
      window.addEventListener("focus", handleFocus, {capture: true});

      return () => {
        if (!pendingResumeAlert) clearResumeAlertListeners();

        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
          {capture: true}
        );
        window.removeEventListener("pagehide", handlePageHide, {capture: true});
        window.removeEventListener("freeze", handleFreeze, {capture: true});
        window.removeEventListener("pageshow", handleFocus, {capture: true});
        window.removeEventListener("focus", handleFocus, {capture: true});
      };
    },

    onAccumulated({accumulated, committer}) {
      if (isDocumentHidden()) {
        hiddenBacklogPending = true;
        committer.update(accumulated);
        return;
      }
      committer.update(accumulated);
    },
  };
}

function createSseLifecycle(runtimeType) {
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW) {
    return createAndroidWebViewSseLifecycle();
  }

  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME) {
    return createChromeSseLifecycle();
  }

  return createMobileBrowserSseLifecycle();
}

function shouldUseSseOverlay(policy) {
  const result = Boolean(policy.overlay && isProgressAllowedForCurrentPlatform());

  logPlatformDebug("sse.overlay", {
    result,
    policyOverlay: Boolean(policy.overlay),
    progressPlatform: "mobile",
  });

  return result;
}

function createSseRuntimeContext() {
  const runtimeType = resolveStreamRuntimeType();
  const policy = resolveApiPolicy(API_KEYS.GENERATION);
  const requestKey = createId();
  const controller =
    policy.abort && typeof AbortController !== "undefined"
      ? new AbortController()
      : null;
  const overlay = shouldUseSseOverlay(policy);

  if (controller) apiRequestStore.registerController(requestKey, controller);
  if (overlay) apiRequestStore.startOverlay();

  const lifecycle = createSseLifecycle(runtimeType);

  logPlatformDebug("sse.context", {
    runtimeType,
    requestKey,
    overlay,
    abort: Boolean(controller),
  });

  return {
    runtimeType,
    controller,
    lifecycle,
    cleanup() {
      apiRequestStore.unregisterController(requestKey);
      if (overlay) apiRequestStore.stopOverlay();
    },
  };
}

function resolveSseAuthOptions() {
  const policy = resolveSessionAuthConfig();

  return {
    withCredentials: true,
    credentials: "include",
    headers: {
      "X-Client-Platform": policy.platform,
    },
  };
}

function resolveApiEndpointUrl(endpoint) {
  const base = shouldUseServerApi()
    ? SERVER_API_BASE_URL
    : DEFAULT_API_BASE_PATH;

  const path = String(endpoint || API_ENDPOINTS.GENERATION);
  if (/^https?:\/\//i.test(path)) return path;

  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function resolveGenerationUrl(endpoint = API_ENDPOINTS.GENERATION) {
  return resolveApiEndpointUrl(endpoint);
}

function resolveGenerationResultUrl(requestId) {
  const base = shouldUseServerApi()
    ? SERVER_API_BASE_URL
    : DEFAULT_API_BASE_PATH;

  const query = encodeURIComponent(requestId || "");
  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION_RESULT}?${G.REQUEST_ID}=${query}`;
}

async function fetchGenerationResult(requestId) {
  if (!requestId) return null;

  const authOptions = resolveSseAuthOptions();
  const response = await fetch(resolveGenerationResultUrl(requestId), {
    method: "GET",
    credentials: authOptions.credentials,
    headers: {
      ...authOptions.headers,
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (response.status === 401 || response.status === 403) {
    resetAuthStateSafely();
    return null;
  }

  if (!response.ok) return null;

  return response.json();
}

const routeMode = computed(() => resolveRouteMode(route.name));
const pageState = {
  isMainPage: computed(() => routeMode.value === "main"),
  isChatPage: computed(() => routeMode.value === "chat"),
  isSharedPage: computed(() => routeMode.value === "shared"),
  isConversationPage: computed(
    () => routeMode.value === "chat" || routeMode.value === "shared"
  ),
};

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

const activeHistory = computed(() => findHistory(activeHistoryId.value));
const readonly = computed(
  () =>
    pageState.isSharedPage.value ||
    chatStore.isActiveSharedRoom ||
    isSharedChat(activeHistory.value)
);
const messages = computed(() => chatStore.activeMessages || []);
const loading = computed(() => chatStore.isWait);
const historyRendering = computed(() => chatStore.isHistoryRendering);
const historyMarkdownVisible = computed(() => chatStore.historyMarkdownVisible);
const historyMessagesLoaded = computed(() => chatStore.historyMessagesLoaded);
const historyRenderKey = computed(() => activeHistoryId.value || "");
const messageRenderPolicy = computed(() =>
  resolveMessageRenderPolicy(activeHistory.value, chatStore.searchTargetMessageId)
);

let historyRenderOverlayActive = false;
let historyRenderFinishSeq = 0;
const abortInfo = {
  seq: 0,
  loadController: null,
  generationController: null,
  generationChatId: null,
};

function waitForNextPaint() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

function findHistory(id) {
  const targetId = normalizeChatId(id);
  if (!targetId) return null;
  return (
    histories.value.find(
      (history) => normalizeChatId(history.chatId) === targetId
    ) || null
  );
}

function isShareChatEntryRoute() {
  return route.name === ROUTE_NAMES.SHARE_CHAT_ENTRY;
}

function getSharedEntryId() {
  if (route.name !== ROUTE_NAMES.SHARED_ENTRY) return "";
  return String(route.params?.id || route.params?.shareId || "").trim();
}

function isAbortError(error) {
  return (
    error?.name === "AbortError" ||
    error?.code === "ERR_CANCELED" ||
    error?.message === "canceled" ||
    error?.message === "The mock request was aborted."
  );
}

function abortLoadRequest() {
  abortInfo.seq += 1;
  abortInfo.loadController?.abort?.();
  abortInfo.loadController = null;
}

function abortGenerationRequest() {
  abortInfo.generationController?.abort?.();
  abortInfo.generationController = null;
  abortInfo.generationChatId = null;
}

function abortAllChatRequests() {
  abortLoadRequest();
  abortGenerationRequest();
}

function createLoadContext() {
  abortLoadRequest();
  const seq = abortInfo.seq;
  const controller =
    typeof AbortController === "function" ? new AbortController() : null;
  abortInfo.loadController = controller;
  return {
    signal: controller?.signal,
    isCurrentLoad: () => seq === abortInfo.seq,
  };
}

function clearSearchTargetMessageId() {
  chatStore.clearSearchTargetMessageId?.();
}

async function flushConversationSwitchPaint({clearMessages = true} = {}) {
  if (clearMessages) {
    chatStore.setActiveMessages([]);
  }
  await nextTick();
  await waitForNextPaint();
}

function beginHistoryRender() {
  historyRenderFinishSeq += 1;
  chatStore.setHistoryRenderState({
    isHistoryRendering: true,
    historyMarkdownVisible: false,
    historyMessagesLoaded: false,
  });

  if (isProgressAllowedForCurrentPlatform() && !historyRenderOverlayActive) {
    apiRequestStore.startOverlay();
    historyRenderOverlayActive = true;
  }
}

function finishHistoryRenderImmediately() {
  historyRenderFinishSeq += 1;
  chatStore.setHistoryRenderState({
    isHistoryRendering: false,
    historyMarkdownVisible: false,
    historyMessagesLoaded: false,
  });
  if (historyRenderOverlayActive) apiRequestStore.stopOverlay();
  historyRenderOverlayActive = false;
}

function finishHistoryRender() {
  const finishSeq = ++historyRenderFinishSeq;

  const revealAfterPaint = async () => {
    try {
      await nextTick();
      await waitForNextPaint();
      if (finishSeq !== historyRenderFinishSeq) return;

      const skipFinalScrollTarget = chatStore.historyMarkdownVisible;
      chatStore.setHistoryRenderState({
        isHistoryRendering: false,
        historyMarkdownVisible: false,
      });

      if (skipFinalScrollTarget) return;

      for (let index = 0; index < 3; index += 1) {
        await nextTick();
        if (finishSeq !== historyRenderFinishSeq) return;
        scrollToInitialTarget(messageRenderPolicy.value.scrollTarget, {
          behavior: "auto",
        });
        await waitForNextPaint();
      }
    } finally {
      if (finishSeq === historyRenderFinishSeq) {
        chatStore.setHistoryRenderState({historyMessagesLoaded: false});
        if (historyRenderOverlayActive) apiRequestStore.stopOverlay();
        historyRenderOverlayActive = false;
      }
    }
  };

  void revealAfterPaint();
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
    if (notifyOnError) {
      logWarn("[ChatHistory] refreshHistories 오류:", error);
    }
    return histories.value;
  }
}

async function findHistoryWithShareChatRefresh(id) {
  const targetId = normalizeChatId(id);
  if (!targetId) return null;

  const cachedHistory = findHistory(targetId);
  if (cachedHistory || !isShareChatEntryRoute()) return cachedHistory;

  await refreshHistories({notifyOnError: false});
  return findHistory(targetId);
}

function shouldPreserveSidebarAssistantOnHistoryOpen() {
  return false;
}

async function ensureConversation(historyId, options = {}) {
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
    Array.isArray(chatStore.assistants) ? chatStore.assistants : [],
    studioRuntimeStore,
    shouldPreserveSidebarAssistantOnHistoryOpen()
  );
  const resolvedSession = sessionState.session || session;

  if (sessionState.nextSelectedAssistantId) {
    chatStore.selectAssistant(sessionState.nextSelectedAssistantId);
  }

  chatStore.setActiveSession(resolvedSession);

  if (!chatStore.messageMap[history.chatId]) {
    const loadedMessages = await loadChatMessageRouters(
      {
        chatId: history.chatId,
        assistId: resolvedSession?.assistantId || history.assistantId,
        modelId: resolvedSession?.modelId || history.modelId,
        studio: resolvedSession?.assistantType === "studio",
      },
      options
    );
    chatStore.setMessages(history.chatId, loadedMessages);
  }

  return chatStore.messageMap[history.chatId] || [];
}

function resetMainRouteConversation() {
  finishHistoryRender();
  chatStore.setActiveMessages([]);
  chatStore.pruneInactiveMessageCache(null);
  chatStore.clearActiveSession();
}

async function handleMissingHistoryId({isCurrentLoad}) {
  const hasPendingChatEntryNavigation = hasPendingChatNavigation();

  beginHistoryRender();
  await flushConversationSwitchPaint();
  if (!isCurrentLoad()) return;
  chatStore.setActiveMessages([]);

  if (!hasPendingChatEntryNavigation) {
    chatStore.clearActiveSession();
  }
  finishHistoryRender();

  if (!hasPendingChatEntryNavigation) {
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
  }
}

async function redirectMissingHistory() {
  clearSearchTargetMessageId(activeHistoryId.value);
  finishHistoryRender();
  await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
}

async function applyPendingNewSubmitHistory(history) {
  finishHistoryRender();
  clearSearchTargetMessageId(history.chatId);
  chatStore.setActiveMessages(chatStore.messageMap?.[history.chatId] || []);
  chatStore.setHistoryRenderState({historyMessagesLoaded: true});
  await nextTick();
}

async function hydrateHistoryConversation({history, isCurrentLoad, signal}) {
  chatStore.setActiveChatRoom(history.chatId);
  beginHistoryRender();
  await flushConversationSwitchPaint();
  if (!isCurrentLoad()) return;
  chatStore.pruneInactiveMessageCache(history.chatId);
  const loadedMessages = await ensureConversation(history.chatId, {signal});
  if (!isCurrentLoad()) return;
  chatStore.setActiveMessages(loadedMessages);
  chatStore.setHistoryRenderState({historyMessagesLoaded: true});
  await nextTick();
  chatStore.pruneInactiveMessageCache(history.chatId);
}

async function replaceShareChatEntryWithChatRoute(historyId) {
  if (!isShareChatEntryRoute()) return;

  const id = normalizeChatId(historyId);
  if (id) {
    chatStore.setActiveChatRoom(id);
  }

  await router.replace({name: ROUTE_NAMES.CHAT_ENTRY}).catch(() => {});
}

async function loadHistoryConversation({isCurrentLoad, signal}) {
  if (pageState.isMainPage.value) {
    resetMainRouteConversation();
    return;
  }

  if (!activeHistoryId.value) {
    const pendingSubmitPayload = chatStore.consumePendingSubmitPayload?.();
    if (pendingSubmitPayload) {
      finishHistoryRenderImmediately();
      chatStore.setActiveMessages([]);
      await submit(pendingSubmitPayload);
      return;
    }

    await handleMissingHistoryId({isCurrentLoad});
    return;
  }

  const history = await findHistoryWithShareChatRefresh(activeHistoryId.value);
  if (!history) {
    await redirectMissingHistory();
    return;
  }

  if (chatStore.consumePendingNewSubmitChat(history.chatId)) {
    await applyPendingNewSubmitHistory(history);
    return;
  }

  await hydrateHistoryConversation({history, isCurrentLoad, signal});

  if (isCurrentLoad()) {
    await replaceShareChatEntryWithChatRoute(history.chatId);
  }
}

async function redirectSharedNotFound() {
  const message = t("chat.sharedNotFoundMessage");
  if (typeof window !== "undefined" && typeof window.alert === "function") {
    window.alert(message);
  }
  chatStore.clearActiveRoom();
  chatStore.setActiveMessages([]);
  finishHistoryRenderImmediately();
  await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
}

async function loadSharedConversation({isCurrentLoad, signal}) {
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
    chatStore.setActiveMessages(result.messages);
    chatStore.setHistoryRenderState({historyMessagesLoaded: true});
    await nextTick();
    finishHistoryRender();
    return;
  }

  if (!activeHistoryId.value) {
    chatStore.setActiveMessages([]);
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

  chatStore.setActiveMessages(result.messages);
  chatStore.setHistoryRenderState({historyMessagesLoaded: true});
  await nextTick();
  finishHistoryRender();
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

function isRouteLoadSourceChanged(nextSource = [], previousSource = []) {
  return JSON.stringify(nextSource || []) !== JSON.stringify(previousSource || []);
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
  const realTargetChanged = isRealRouteLoadTargetChanged(nextSource, previousSource);

  if (sourceChanged && realTargetChanged) {
    overlayBackStore.clearSuppressNextChatRouteLoad();
    return false;
  }

  overlayBackStore.consumeSuppressNextChatRouteLoad(activeHistoryId.value);
  return true;
}

async function loadConversation() {
  const {signal, isCurrentLoad} = createLoadContext();

  try {
    await appBootstrap.ensureInitialized();
    if (await reconcileHiddenConversationRoute()) return;

    if (pageState.isSharedPage.value) {
      await loadSharedConversation({isCurrentLoad, signal});
      return;
    }

    await loadHistoryConversation({isCurrentLoad, signal});
  } catch (error) {
    if (!isCurrentLoad() || isAbortError(error)) return;

    if (pageState.isSharedPage.value) {
      await redirectSharedNotFound();
      return;
    }

    clearSearchTargetMessageId(activeHistoryId.value);
    finishHistoryRender();
    logWarn("[ChatHistory] loadConversation 오류:", error);
  } finally {
    if (isCurrentLoad()) {
      abortInfo.loadController = null;
    }
  }
}

function handleHistoryRendered() {
  finishHistoryRender();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitAnimationFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function normalizePromptPayload(payload) {
  if (typeof payload === "string") {
    return {text: payload.trim(), attachments: [], keyboardOpenOnSubmit: false};
  }

  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
    keyboardOpenOnSubmit: payload?.keyboardOpenOnSubmit === true,
  };
}

function resolveSubmitAssistantId() {
  return chatStore.activeSession?.assistantId || chatStore.selectedAssistantId || "";
}

function resolveSubmitModelId() {
  return chatStore.activeSession?.modelId || chatStore.selectedModelId || "";
}

function isSelectedModelReasoning() {
  const modelId = resolveSubmitModelId();
  return Boolean(chatStore.modelMap?.[modelId]?.isReasoning);
}


async function commitFirstAnswerChunk(content, getChatResponse, commit) {
  if (getChatResponse().reasoningStatus === "thinking") {
    commit({reasoningStatus: "completed", content});
    await nextTick();
    return;
  }

  commit({content});
}

function createRequestPayload(base = {}) {
  return {
    [G.MESSAGE_ID]: createId("message"),
    [G.RESPONSE_MESSAGE_ID]: createId("message"),
    ...base,
  };
}

function resolveStyleOptions(settings = {}) {
  const values = [];

  Object.values(settings.promptTemplateOptions || {}).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) values.push(String(item));
      });
      return;
    }

    if (value) values.push(String(value));
  });

  return values;
}

function createGenerationPayload(normalized, chatId, selectedAssistantId, selectedModel) {
  const resolvedChatId = normalizeChatId(chatId);

  if (!resolvedChatId) {
    throw new Error("generation.do payload requires chatId from new.do or current route.");
  }

  const settings = promptControlStore.activePromptToolSettings || {};
  const knowledgeSearch = Array.isArray(settings.knowledgeSearch)
    ? settings.knowledgeSearch.filter(Boolean)
    : [];

  return createRequestPayload({
    [G.CHAT_ID]: resolvedChatId,
    [G.ASSIST_ID]: selectedAssistantId || "",
    [G.MODEL_ID]: selectedModel || "",
    [G.STUDIO]: false,
    [G.INTENTION]: "직접입력",
    [G.RAG]: knowledgeSearch.length > 0,
    [G.RAG_COT]: false,
    [G.IMAGE_S3_PATH_LEGACY]: null,
    [G.SOURCE_TYPE]: "internal",
    [G.ARRAY_OPTIONS]: knowledgeSearch,
    [G.MESSAGE_FILE_HISTORY]: null,
    [G.STYLES]: resolveStyleOptions(settings),
    [G.BODY]: normalized.text,
    [G.BYTE_SIZE]: 10000,
    [G.LAST_FEDERATION_INFO]: null,
    [G.UI_STATE_INFO_WRAPPER]: null,
  });
}

function resolveStreamErrorTitle(error) {
  if (error?.doneMissing) return "답변 생성이 완료되지 않았습니다";
  return "답변 생성 실패";
}

function resolveStreamErrorMessage(error, fallbackMessage) {
  const message = String(error?.message || "").trim();
  if (error?.doneMissing) {
    return "서버 응답이 완료 신호 없이 종료되었습니다. 잠시 후 다시 시도해 주세요.";
  }

  if (error?.streamError && message) return message;
  if (message && !/generation stream failed|generation stream returned error/i.test(message)) {
    return message;
  }

  return fallbackMessage || "사용량이 많아 잠시후 다시 확인해주세요";
}

function resolveStreamErrorCode(error) {
  if (error?.doneMissing) return "SSE_DONE_MISSING";
  return error?.streamErrorCode || "SSE_STREAM_ERROR";
}

function readFirstString(...values) {
  const found = values.find((value) => typeof value === "string" && value.trim());
  return found ? found.trim() : "";
}

const DONE_STREAM_MESSAGE = "[DONE]";

function normalizeStreamRawMessage(raw) {
  return String(raw || "");
}

function createUnchangedStreamState(accumulated) {
  return {accumulated, changed: false, done: false};
}

function createDoneStreamState(accumulated) {
  return {accumulated, changed: false, done: true};
}

function appendNormalStreamText(raw, accumulated) {
  const text = normalizeStreamRawMessage(raw);
  const normalized = text.trim();

  if (!normalized) return createUnchangedStreamState(accumulated);
  if (normalized === DONE_STREAM_MESSAGE) return createDoneStreamState(accumulated);

  return {
    accumulated: accumulated + text,
    changed: true,
    done: false,
  };
}

function parseStreamJsonSafely(raw) {
  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function readThinkStreamContent(raw) {
  const parsed = parseStreamJsonSafely(raw);
  if (!parsed || typeof parsed !== "object") return "";

  const delta = parsed.delta || parsed.data || parsed.message || {};
  return readFirstString(
    parsed.content,
    parsed.answer,
    parsed.text,
    parsed.reasoning,
    parsed.reasoningContent,
    delta.content,
    delta.answer,
    delta.text,
    delta.reasoning,
    delta.reasoningContent
  );
}

function parseNormalGenerationMessage(raw, accumulated) {
  return appendNormalStreamText(raw, accumulated);
}

function parseThinkGenerationMessage(raw, accumulated) {
  const text = normalizeStreamRawMessage(raw);
  const normalized = text.trim();

  if (!normalized) return createUnchangedStreamState(accumulated);
  if (normalized === DONE_STREAM_MESSAGE) return createDoneStreamState(accumulated);

  const content = readThinkStreamContent(text);
  if (content) {
    return {
      accumulated: accumulated + content,
      changed: true,
      done: false,
    };
  }

  return appendNormalStreamText(text, accumulated);
}

function resolveGenerationStreamParserFromPayload(payload = {}) {
  const modelId = String(payload?.[G.MODEL_ID] || payload?.[G.MODEL_ID_LEGACY] || "");

  switch (modelId) {
    case GENERATION_ERROR_TEST_MODEL_ID:
      return parseThinkGenerationMessage;
    default:
      return parseNormalGenerationMessage;
  }
}

function resolveGenerationRequestId(payload = {}) {
  return readFirstString(
    payload?.[G.REQUEST_ID],
    payload?.[G.REQUEST_ID_SNAKE],
    payload?.[G.MESSAGE_ID],
    payload?.[G.RESPONSE_MESSAGE_ID]
  );
}

function resolveGenerationPromptText(payload = {}) {
  return readFirstString(payload?.[G.BODY], payload?.[G.INPUT]);
}

function createGenerationStreamError(
  message = "generation stream returned error",
  code = "SSE_STREAM_ERROR",
  status
) {
  const error = new Error(message || "generation stream returned error");
  error.name = "GenerationStreamError";
  error.streamError = true;
  error.streamErrorCode = code || "SSE_STREAM_ERROR";
  if (status) error.status = status;
  return error;
}

const DEFAULT_GENERATION_STREAM_TIMEOUT_MS = 120000;

function resolveGenerationStreamTimeoutMs() {
  const raw = Number(process.env.VUE_APP_GENERATION_STREAM_TIMEOUT || 0);
  return Number.isFinite(raw) && raw > 0
    ? raw
    : DEFAULT_GENERATION_STREAM_TIMEOUT_MS;
}

function createGenerationTimeoutError() {
  const error = createGenerationStreamError(
    "generation stream timed out",
    "SSE_STREAM_TIMEOUT"
  );
  error.timeout = true;
  return error;
}

function readEventErrorMessage(event) {
  const rawData = event?.data;
  if (typeof rawData === "string" && rawData.trim()) return rawData;
  return event?.message || "generation stream failed";
}

function createSseEventError(event) {
  const status = event?.status || event?.responseCode;
  return createGenerationStreamError(
    readEventErrorMessage(event),
    "SSE_EVENT_ERROR",
    status
  );
}

function createGenerationDoneMissingError() {
  const error = createGenerationStreamError(
    "generation stream closed before DONE",
    "SSE_DONE_MISSING"
  );
  error.doneMissing = true;
  return error;
}

function getUnauthorizedStreamStatus(error) {
  const status = Number(
    error?.status || error?.responseCode || error?.code || 0
  );
  return status === 401 || status === 403 ? status : 0;
}

async function generationMock(_url, payload = {}, handlers = {}, options = {}) {
  const {onChunk, onComplete} = handlers;
  const promptText = resolveGenerationPromptText(payload);
  const text = pickGenerationSample(promptText);
  const requestId = resolveGenerationRequestId(payload);

  await streamText(text, (chunk) => onChunk?.(chunk), {
    delay: 18,
    signal: options.signal,
  });

  await onComplete?.({requestId});

  return {
    completed: true,
    requestId,
    accumulated: text,
    runtimeType: "mock",
  };
}

async function generation(
  url = API_ENDPOINTS.GENERATION,
  payload = {},
  handlers = {},
  options = {}
) {
  if (!shouldUseServerApi()) return generationMock(url, payload, handlers, options);

  const context = createSseRuntimeContext();
  logPlatformDebug("sse.route", {runtimeType: context.runtimeType});

  const abort = () => context.controller?.abort?.();
  options.signal?.addEventListener?.("abort", abort, {once: true});

  try {
    if (options.signal?.aborted) abort();
    return await runSseGenerationStreamInVue(
      url,
      payload,
      handlers,
      context.controller,
      context.lifecycle,
      context.runtimeType
    );
  } finally {
    options.signal?.removeEventListener?.("abort", abort);
    context.cleanup?.();
  }
}

async function runSseGenerationStreamInVue(
  generationUrl,
  payload,
  handlers,
  controller,
  lifecycle,
  runtimeType = "unknown"
) {
  const {onChunk, onComplete} = handlers || {};
  const committer = createChunkCommitter(onChunk);
  let source = null;
  let accumulated = "";
  let completed = false;
  let settled = false;

  const cleanupLifecycle = lifecycle?.install?.({
    controller,
    flush: () => committer.flush(accumulated),
  });

  const requestUrl = resolveGenerationUrl(generationUrl);
  const requestId = resolveGenerationRequestId(payload);
  const parseStreamMessage = resolveGenerationStreamParserFromPayload(payload);

  const closeSource = () => {
    if (!source) return;
    source.close();
  };

  const abortListener = () => closeSource();
  controller?.signal?.addEventListener?.("abort", abortListener, {once: true});

  const executeStream = async (authOptions) => {
    completed = false;
    settled = false;

    await new Promise((resolve, reject) => {
      let timeoutId = null;
      const clearStreamTimeout = () => {
        if (!timeoutId) return;
        clearTimeout(timeoutId);
        timeoutId = null;
      };
      const finishResolve = () => {
        if (settled) return;
        settled = true;
        clearStreamTimeout();
        resolve();
      };
      const finishReject = (error) => {
        if (settled) return;
        settled = true;
        clearStreamTimeout();
        closeSource();
        reject(error);
      };

      const timeoutMs = resolveGenerationStreamTimeoutMs();
      timeoutId = setTimeout(() => {
        finishReject(createGenerationTimeoutError());
      }, timeoutMs);

      source = new SSE(requestUrl, {
        start: false,
        method: "POST",
        withCredentials: authOptions.withCredentials,
        autoReconnect: false,
        headers: {
          ...authOptions.headers,
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "Cache-Control": "no-cache",
        },
        payload: JSON.stringify(payload || {}),
      });

      const sourceEvent = {
        onMessage(event) {
          try {
            if (controller?.signal?.aborted) {
              throw controller.signal.reason || createAbortError("Aborted");
            }

            const nextState = parseStreamMessage(event.data, accumulated);
            accumulated = nextState.accumulated;

            if (nextState.changed) {
              lifecycle?.onAccumulated?.({accumulated, committer});
            }
            if (nextState.done) {
              completed = true;
              finishResolve();
              sourceEvent.close();
            }
          } catch (error) {
            sourceEvent.close();
            finishReject(error);
          }
        },
        onError(event) {
          finishReject(createSseEventError(event));
        },
        onAbort() {
          if (controller?.signal?.aborted) {
            finishReject(controller.signal.reason || createAbortError("Aborted"));
            return;
          }
          if (!completed) {
            finishReject(createAbortError("generation stream aborted"));
          }
        },
        _onReadyStateChange() {
          if (
            source?.readyState === SSE.CLOSED &&
            !completed &&
            !controller?.signal?.aborted
          ) {
            finishReject(createGenerationDoneMissingError());
          }
        },
        stream() {
          source?.stream?.();
        },
        close() {
          closeSource();
        },
      };

      source.addEventListener("message", sourceEvent.onMessage);
      source.addEventListener("error", sourceEvent.onError);
      source.addEventListener("abort", sourceEvent.onAbort);
      source.addEventListener("readystatechange", sourceEvent._onReadyStateChange);

      sourceEvent.stream();
    });
  };

  try {
    const authOptions = resolveSseAuthOptions();

    try {
      await executeStream(authOptions);
    } catch (error) {
      if (getUnauthorizedStreamStatus(error) && !controller?.signal?.aborted) {
        resetAuthStateSafely();
      }
      throw error;
    }

    await committer.flush(accumulated);
    await onComplete?.({requestId});

    return {
      completed: true,
      requestId,
      accumulated,
      runtimeType,
    };
  } catch (error) {
    await committer.flush(accumulated);
    error.accumulated = accumulated;
    error.generationRequestId = requestId;
    throw error;
  } finally {
    controller?.signal?.removeEventListener?.("abort", abortListener);
    cleanupLifecycle?.();
    closeSource();
  }
}

function adaptGenerationResultContent(response) {
  const body = unwrapApiBody(response, response) || {};
  return readFirstString(
    body?.[G.CONTENT],
    body?.[G.ANSWER],
    body?.[R.DATA],
    response?.[G.CONTENT],
    response?.[G.ANSWER],
    response?.[R.DATA]
  );
}

async function resolveGenerationResultContent(requestId) {
  try {
    const result = await fetchGenerationResult(requestId);
    return adaptGenerationResultContent(result);
  } catch (error) {
    logWarn("[ChatHistory] generation result sync failed:", error);
    return "";
  }
}

function createGenerationErrorCause(error, fallbackMessage) {
  return {
    code: resolveStreamErrorCode(error),
    message: resolveStreamErrorMessage(error, fallbackMessage),
    errorMessage: resolveStreamErrorMessage(error, fallbackMessage),
    timeout: error?.timeout === true,
    doneMissing: error?.doneMissing === true,
    status: error?.status,
  };
}

async function replaceWithGenerationErrorMessages({
  payload,
  chatId,
  error,
  setConversation,
  renderAfterStream: afterRender,
  errorFallbackMessage,
  logPrefix,
}) {
  if (!payload || typeof setConversation !== "function") return false;

  try {
    const messages = await loadGenerationErrorMessages(
      payload,
      createGenerationErrorCause(error, errorFallbackMessage)
    );

    if (!Array.isArray(messages) || messages.length === 0) return false;

    setConversation(chatId, messages);
    await nextTick();

    if (typeof afterRender === "function") {
      await afterRender();
    }

    return true;
  } catch (fallbackError) {
    logWarn(`${logPrefix} error.do fallback failed:`, fallbackError);
    return false;
  }
}

function commitStreamError(error, commit, getChatResponse, errorFallbackMessage) {
  commit({
    status: "error",
    error: true,
    errorTitle: resolveStreamErrorTitle(error),
    errorMessage: resolveStreamErrorMessage(error, errorFallbackMessage),
    errorCode: resolveStreamErrorCode(error),
    isReasoning: getChatResponse().isReasoning,
    reasoningContent: getChatResponse().reasoningContent || "",
    reasoningStatus: "completed",
    content: "",
  });
}

function commitStreamFallback(
  error,
  syncedContent,
  isAbort,
  commit,
  getChatResponse,
  abortFallbackMessage,
  errorFallbackMessage
) {
  const fallbackContent =
    syncedContent ||
    error.accumulated ||
    getChatResponse().content ||
    (isAbort ? abortFallbackMessage : errorFallbackMessage);

  commit({
    status: fallbackContent ? "complete" : "error",
    error: false,
    errorTitle: "",
    errorMessage: "",
    errorCode: "",
    isReasoning: getChatResponse().isReasoning,
    reasoningContent: getChatResponse().reasoningContent || "",
    reasoningStatus: "completed",
    content: fallbackContent,
  });
}

async function runAssistantStream(
  normalized,
  chatId,
  selectedAssistantId,
  selectedModel,
  afterRender,
  commit,
  getChatResponse,
  scheduleStreamScroll,
  abortFallbackMessage,
  errorFallbackMessage,
  logPrefix = "[ChatHistory]",
  options = {}
) {
  let generationPayload = null;

  try {
    generationPayload = createGenerationPayload(
      normalized,
      chatId,
      selectedAssistantId,
      selectedModel
    );

    await generation(
      API_ENDPOINTS.GENERATION,
      generationPayload,
      {
        onChunk: async (content) => {
          await commitFirstAnswerChunk(content, getChatResponse, commit);
          scheduleStreamScroll();
        },
        onComplete: () => {
          commit({status: "complete", reasoningStatus: "completed"});
        },
      },
      {signal: options.signal}
    );

    commit({status: "complete", reasoningStatus: "completed"});
    await nextTick();
    if (typeof afterRender === "function") {
      await afterRender();
    }
  } catch (error) {
    const isAbort = isGenerationAbortError(error);
    logWarn(
      `${logPrefix} ${isAbort ? "스트리밍이 중단되었습니다" : "스트리밍 오류"}:`,
      error
    );

    if (!isAbort) {
      const replaced = await replaceWithGenerationErrorMessages({
        payload: generationPayload,
        chatId,
        error,
        setConversation: options.setConversation,
        renderAfterStream: afterRender,
        errorFallbackMessage,
        logPrefix,
      });
      if (replaced) return;
    }

    const syncedContent = await resolveGenerationResultContent(error.generationRequestId);

    if (!isAbort && !syncedContent) {
      commitStreamError(error, commit, getChatResponse, errorFallbackMessage);
      return;
    }

    commitStreamFallback(
      error,
      syncedContent,
      isAbort,
      commit,
      getChatResponse,
      abortFallbackMessage,
      errorFallbackMessage
    );
  }
}

async function waitForKeyboardViewportToSettle() {
  if (typeof window === "undefined") return;

  const viewport = window.visualViewport;
  if (!viewport) {
    await wait(240);
    return;
  }

  let lastHeight = viewport.height;
  let lastChangeAt = Date.now();
  const startedAt = Date.now();

  const handleResize = () => {
    const nextHeight = viewport.height;
    if (Math.abs(nextHeight - lastHeight) > 1) {
      lastHeight = nextHeight;
      lastChangeAt = Date.now();
    }
  };

  viewport.addEventListener("resize", handleResize, {passive: true});
  try {
    while (Date.now() - startedAt < 900) {
      handleResize();
      if (Date.now() - lastChangeAt >= 140) break;
      await wait(40);
    }
    await waitAnimationFrame();
    await waitAnimationFrame();
  } finally {
    viewport.removeEventListener("resize", handleResize);
  }
}

function createFallbackHistoryForNewSubmit({chatId, chatTitle, assistantId, modelId}) {
  return adaptChatHistory(
    {
      chatId,
      chatTitle: chatTitle || "새 대화",
      assistId: assistantId,
      modelId,
      modeId: modelId,
      bookmarkYN: false,
      chatEndDt: new Date().toISOString(),
    },
    {
      assistantMap: chatStore.assistantMap,
      modelMap: chatStore.modelMap,
    }
  );
}

async function createRemoteConversation({text, assistantId, modelId} = {}) {
  const chatId = createId();
  const chatTitle = String(text || "").trim().slice(0, 20);
  const assistant = chatStore.assistantMap?.[assistantId] || null;
  const rawHistory = await createChatHistory({
    chatId,
    assistId: assistantId,
    modelId,
    ChatTilte: chatTitle || String(text || "").trim(),
    studio: assistant?.type === "studio",
  });
  let history = adaptChatHistory(rawHistory, {
    assistantMap: chatStore.assistantMap,
    modelMap: chatStore.modelMap,
  });

  if (!history?.chatId) {
    logWarn("[ChatHistory] new.do 응답에 chatId가 없어 요청 chatId로 대체합니다.", rawHistory);
    history = createFallbackHistoryForNewSubmit({
      chatId,
      chatTitle: chatTitle || String(text || "").trim(),
      assistantId,
      modelId,
    });
  }

  chatStore.addHistory(history);
  chatStore.setMessages(history.chatId, []);
  chatStore.setActiveSession(
    createSessionFromHistory(history, chatStore.modelMap, chatStore.assistantMap)
  );

  return history;
}

function createLocalConversation({text} = {}) {
  const history = createLocalHistory(
    text,
    chatStore.currentAssistant,
    chatStore.currentModel || chatStore.currentModels[0]
  );
  chatStore.addHistory(history);
  chatStore.setMessages(history.chatId, []);
  chatStore.setActiveSession(
    createSessionFromHistory(history, chatStore.modelMap, chatStore.assistantMap)
  );
  return history;
}

async function createConversationForSubmit(normalized) {
  const assistantId = resolveSubmitAssistantId();
  const modelId = resolveSubmitModelId();

  try {
    return await createRemoteConversation({text: normalized.text, assistantId, modelId});
  } catch (error) {
    if (shouldUseServerApi()) {
      logWarn("[ChatHistory] new.do 호출 실패:", error);
      throw error;
    }
    logWarn("[ChatHistory] new.do 호출 실패, local conversation으로 대체:", error);
    return createLocalConversation(normalized);
  }
}

function shouldCreateConversation(targetHistoryId) {
  if (targetHistoryId) return false;
  return route.name === ROUTE_NAMES.MAIN || route.name === ROUTE_NAMES.CHAT_ENTRY;
}

async function ensureConversationForSubmit(normalized, currentHistoryId) {
  let targetHistoryId = normalizeChatId(currentHistoryId);

  if (!shouldCreateConversation(targetHistoryId)) {
    return targetHistoryId;
  }

  const history = await createConversationForSubmit(normalized);
  targetHistoryId = normalizeChatId(history?.chatId);

  if (!targetHistoryId) {
    throw new Error("new.do response does not contain chatId.");
  }

  chatStore.markPendingNewSubmitChat(targetHistoryId);
  return targetHistoryId;
}

function setConversationMessages(chatId, nextMessages) {
  const list = Array.isArray(nextMessages) ? nextMessages : [];
  chatStore.setMessages(chatId, list);
  if (normalizeChatId(chatId) === normalizeChatId(resolveActiveChatId())) {
    chatStore.setActiveMessages(list);
  }
}

function appendUserAndChatResponses(chatId, normalized) {
  const result = appendMessagesToChat(chatId, normalized);
  if (Array.isArray(result.messages)) {
    chatStore.setActiveMessages(result.messages);
  }
  return result;
}

function createSubmitCommitter(targetHistoryId, currentMessages, assistantMessage) {
  return createChatResponseCommitter(
    targetHistoryId,
    currentMessages,
    {
      ...assistantMessage,
      ...createAssistantStreamingPatch(isSelectedModelReasoning()),
    },
    setConversationMessages
  );
}

function createRegenerateChatResponse() {
  return createChatResponse(createAssistantStreamingPatch(isSelectedModelReasoning()));
}

function findChatUserForRegenerate(sourceMessages, assistantIndex) {
  return [...sourceMessages]
    .slice(0, assistantIndex)
    .reverse()
    .find((item) => item.role === "user");
}

function createStreamScrollScheduler() {
  return () => {};
}

function createGenerationContext(chatId) {
  abortGenerationRequest();
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  abortInfo.generationController = controller;
  abortInfo.generationChatId = normalizeChatId(chatId);
  return {
    signal: controller?.signal,
    clear: () => {
      if (abortInfo.generationController === controller) {
        abortInfo.generationController = null;
        abortInfo.generationChatId = null;
      }
    },
  };
}

async function renderAfterStream() {
  await nextTick();
  await waitForNextPaint();
}

async function scrollAfterUserSubmit(normalized = {}) {
  await nextTick();

  if (normalized.keyboardOpenOnSubmit) {
    await waitForKeyboardViewportToSettle();
    await nextTick();
  }

  await scrollToLatestChatUser({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: normalized.keyboardOpenOnSubmit === true,
    keyboardOpenOnSubmit: normalized.keyboardOpenOnSubmit === true,
  });
}

async function replaceWithMockGenerationErrorMessages({
  normalized,
  targetHistoryId,
  selectedAssistantId,
  selectedModel,
  logPrefix = "[ChatHistory]",
}) {
  const payload = createGenerationPayload(
    normalized,
    targetHistoryId,
    selectedAssistantId,
    selectedModel
  );
  const messages = await loadGenerationErrorMessages(payload, {
    code: "MOCK_FORCED_GENERATION_ERROR",
    message: "error 답변 채팅에서 mock error.do 흐름을 강제 실행했습니다.",
  });

  if (!Array.isArray(messages) || messages.length === 0) {
    logWarn(`${logPrefix} mock error.do 응답 메시지가 없습니다.`);
    return false;
  }

  setConversationMessages(targetHistoryId, messages);
  await renderAfterStream();
  return true;
}

function canSubmitChatMessage() {
  return !readonly.value && !historyRendering.value && !chatStore.activeSession?.isModelUnavailable;
}

async function submit(payload) {
  const normalized = normalizePromptPayload(payload);
  if (
    chatStore.isActiveSharedRoom ||
    !canSubmitChatMessage() ||
    (!normalized.text && normalized.attachments.length === 0) ||
    chatStore.isWait
  ) {
    return;
  }

  chatStore.startWait();

  const initialHistoryId = normalizeChatId(resolveActiveChatId());
  const isNewConversationSubmit = shouldCreateConversation(initialHistoryId);
  let overlaySuppressed = false;

  if (isNewConversationSubmit) {
    apiRequestStore.suppressOverlay();
    overlaySuppressed = true;
  }

  let generationContext = null;

  try {
    const targetHistoryId = await ensureConversationForSubmit(normalized, initialHistoryId);
    generationContext = createGenerationContext(targetHistoryId);

    if (isNewConversationSubmit) {
      promptControlStore.promoteDraftPromptToolSettingsToChat(targetHistoryId);
    }

    const {messages: nextMessages, assistantMessage} = appendUserAndChatResponses(
      targetHistoryId,
      normalized
    );

    const committer = createSubmitCommitter(targetHistoryId, nextMessages, assistantMessage);
    const scheduleStreamScroll = createStreamScrollScheduler();

    committer.commit();

    if (isNewConversationSubmit) {
      await refreshHistories({notifyOnError: true});
      await enterNewSubmitChatRoom(router, targetHistoryId);
    } else {
      void refreshHistories({notifyOnError: true});
    }

    await scrollAfterUserSubmit(normalized);

    const selectedAssistantId = resolveSubmitAssistantId();
    const selectedModel = resolveSubmitModelId();

    if (isGenerationErrorTestChat(targetHistoryId)) {
      await replaceWithMockGenerationErrorMessages({
        normalized,
        targetHistoryId,
        selectedAssistantId,
        selectedModel,
        logPrefix: "[ChatHistory]",
      });
      return;
    }

    await runAssistantStream(
      normalized,
      targetHistoryId,
      selectedAssistantId,
      selectedModel,
      renderAfterStream,
      committer.commit,
      committer.getChatResponse,
      scheduleStreamScroll,
      "(응답 생성이 중단되었습니다.)",
      "사용량이 많아 잠시후 다시 확인해주세요",
      "[ChatHistory]",
      {setConversation: setConversationMessages, signal: generationContext.signal}
    );
  } finally {
    generationContext?.clear?.();
    if (overlaySuppressed) {
      apiRequestStore.resumeOverlay();
      overlaySuppressed = false;
    }
    chatStore.finishWait();
  }
}

async function regenerate(message = {}) {
  if (chatStore.isActiveSharedRoom || !canSubmitChatMessage() || chatStore.isWait) {
    return;
  }

  const targetHistoryId = normalizeChatId(resolveActiveChatId());
  if (!targetHistoryId) return;

  const currentMessages = Array.isArray(messages.value) ? messages.value : [];
  const assistantIndex = currentMessages.findIndex((item) => item.id === message.id);
  if (assistantIndex <= 0) return;

  const userMessage = findChatUserForRegenerate(currentMessages, assistantIndex);
  if (!userMessage) return;

  const normalized = normalizePromptPayload({
    text: userMessage.content,
    attachments: userMessage.attachments || [],
  });
  const assistantMessage = createRegenerateChatResponse();
  const committer = createChatResponseCommitter(
    targetHistoryId,
    [...currentMessages.slice(0, assistantIndex), assistantMessage],
    assistantMessage,
    setConversationMessages
  );
  const scheduleStreamScroll = createStreamScrollScheduler();
  const generationContext = createGenerationContext(targetHistoryId);

  chatStore.startWait();
  committer.commit();
  await nextTick();
  await scrollToLatestChatUser({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: false,
  });

  try {
    const selectedAssistantId = resolveSubmitAssistantId();
    const selectedModel = resolveSubmitModelId();

    if (isGenerationErrorTestChat(targetHistoryId)) {
      await replaceWithMockGenerationErrorMessages({
        normalized,
        targetHistoryId,
        selectedAssistantId,
        selectedModel,
        logPrefix: "[ChatHistory] 재생성",
      });
      return;
    }

    await runAssistantStream(
      normalized,
      targetHistoryId,
      selectedAssistantId,
      selectedModel,
      renderAfterStream,
      committer.commit,
      committer.getChatResponse,
      scheduleStreamScroll,
      "(응답 재생성이 중단되었습니다.)",
      "사용량이 많아 잠시후 다시 확인해주세요",
      "[ChatHistory] 재생성",
      {setConversation: setConversationMessages, signal: generationContext.signal}
    );
  } finally {
    generationContext.clear();
    chatStore.finishWait();
  }
}



function abortGenerationIfSwitchingConversation() {
  const generationChatId = normalizeChatId(abortInfo.generationChatId);
  if (!generationChatId) return;

  const currentChatId = normalizeChatId(resolveActiveChatId() || activeHistoryId.value);
  if (currentChatId && currentChatId === generationChatId) return;

  abortGenerationRequest();
}

watch(
  () => [
    chatStore.selectedChatId,
    chatStore.activeRoomId,
    chatStore.activeRoomType,
    activeHistoryId.value,
    route.params.id,
    route.params.shareId,
    chatStore.searchTargetMessageId,
    routeMode.value,
  ],
  async (nextSource, previousSource) => {
    if (!pageState.isConversationPage.value) {
      abortAllChatRequests();
      return;
    }
    if (shouldSkipRouteLoadForOverlayBack(nextSource, previousSource)) {
      abortLoadRequest();
      return;
    }
    abortGenerationIfSwitchingConversation();
    await loadConversation();
  },
  {immediate: true}
);

watch(
  () => {
    if (!pageState.isChatPage.value || !activeHistoryId.value) return null;
    return chatStore.messageMap?.[activeHistoryId.value] || null;
  },
  (nextMessages) => {
    if (!Array.isArray(nextMessages)) return;
    if (chatStore.isHistoryRendering) return;
    if (chatStore.activeMessages === nextMessages) return;
    chatStore.setActiveMessages(nextMessages);
  },
  {deep: true}
);

onMounted(() => {
  void appBootstrap.ensureInitialized();
});

onBeforeUnmount(() => {
  abortAllChatRequests();
  finishHistoryRenderImmediately();
});


const listProps = new Proxy(
  {},
  {
    get(_target, key) {
      if (key === "visible") return componentProps.visible;
      if (key === "messages") return messages.value;
      if (key === "loading") return loading.value;
      if (key === "historyRendering") return historyRendering.value;
      if (key === "historyMarkdownVisible") return historyMarkdownVisible.value;
      if (key === "historyMessagesReady") return historyMessagesLoaded.value;
      if (key === "historyRenderKey") return historyRenderKey.value;
      if (key === "messageRenderPolicy") return messageRenderPolicy.value;
      if (key === "readonly") return readonly.value;
      return undefined;
    },
  }
);
const props = listProps;




function createMessageTurnSectors(messages = []) {
  const sectors = [];

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const nextMessage = messages[index + 1];
    const sectorMessages = [message];

    if (message?.role === "user" && nextMessage?.role === "assistant") {
      sectorMessages.push(nextMessage);
      index += 1;
    }

    sectors.push({
      id: sectorMessages
        .map((item, itemIndex) => String(item?.id || `${index}-${itemIndex}`))
        .join("__"),
      messages: sectorMessages,
    });
  }

  return sectors;
}

const messageTurnSectors = computed(() =>
  createMessageTurnSectors(props.messages)
);

const lastTurnSectorMinHeight = ref(0);
let lastTurnSectorResizeObserver = null;
let lastTurnSectorResizeFrame = 0;

function isLastTurnSector(sectorIndex) {
  return (
    sectorIndex >= 0 && sectorIndex === messageTurnSectors.value.length - 1
  );
}

function shouldApplyLastTurnSectorMinHeight(sectorIndex) {
  if (props.loading || !isLastTurnSector(sectorIndex)) {
    return false;
  }

  const sector = messageTurnSectors.value[sectorIndex];
  return sector?.messages?.some((message) => message?.role === "assistant");
}

function getTurnSectorStyle(sectorIndex) {
  if (
    !shouldApplyLastTurnSectorMinHeight(sectorIndex) ||
    lastTurnSectorMinHeight.value <= 0
  ) {
    return null;
  }

  return {
    minHeight: `${lastTurnSectorMinHeight.value}px`,
  };
}

function isLastChatResponse(message) {
  if (!message || message.role !== "assistant") {
    return false;
  }

  for (let index = props.messages.length - 1; index >= 0; index -= 1) {
    const candidate = props.messages[index];
    if (candidate?.role === "assistant") {
      return candidate === message || candidate?.id === message.id;
    }
  }

  return false;
}

const scrollRef = ref(null);
const bottomRef = ref(null);
const userIsAtBottom = ref(true);
let stableScrollTimerIds = [];
let historyRenderRunId = 0;
let historyRenderCompleting = false;
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();

// -------------------------------------------------------------------------
// OverlayScrollbar lifecycle and rendered-frame scheduling
// -------------------------------------------------------------------------
let overlayScrollViewport = null;
let overlayScrollSource = null;
let trackedRafIds = [];
let renderedFrameRafId = 0;
let renderedFrameNeedsSpacer = false;
let renderedFrameNeedsBottomState = false;

function getScrollElement() {
  return overlayScrollViewport || scrollRef.value;
}

function cleanupOverlayScrollbar() {
  if (overlayScrollViewport && overlayScrollViewport !== overlayScrollSource) {
    overlayScrollViewport.removeEventListener("scroll", handleScroll);
  }
  if (overlayScrollSource) destroyOverlayScrollbar(overlayScrollSource);
  overlayScrollViewport = null;
  overlayScrollSource = null;
}

function setupOverlayScrollbar() {
  if (!shouldUseOverlayScrollbar.value) {
    cleanupOverlayScrollbar();
    return;
  }

  const element = scrollRef.value;
  if (!element || overlayScrollSource === element) return;

  cleanupOverlayScrollbar();
  overlayScrollSource = element;
  const instance = initOverlayScrollbar(
    element,
    {
      overflow: {x: "hidden", y: "scroll"},
    },
    {enabled: () => shouldUseOverlayScrollbar.value}
  );

  if (!instance) {
    overlayScrollSource = null;
    overlayScrollViewport = null;
    return;
  }

  overlayScrollViewport = getOverlayScrollbarViewport(element);
  if (overlayScrollViewport && overlayScrollViewport !== element) {
    overlayScrollViewport.addEventListener("scroll", handleScroll, {
      passive: true,
    });
  }
}

function updateOverlayScrollbarFrame() {
  if (!overlayScrollSource) return;
  updateOverlayScrollbar(overlayScrollSource);
}

function scheduleTrackedAnimationFrame(callback) {
  if (typeof window === "undefined") {
    callback?.();
    return 0;
  }

  const rafId = window.requestAnimationFrame(() => {
    trackedRafIds = trackedRafIds.filter((id) => id !== rafId);
    callback?.();
  });
  trackedRafIds.push(rafId);
  return rafId;
}

function clearTrackedAnimationFrames() {
  if (typeof window === "undefined") {
    trackedRafIds = [];
    return;
  }

  trackedRafIds.forEach((rafId) => window.cancelAnimationFrame(rafId));
  trackedRafIds = [];
}

function clearRenderedFrameScheduler() {
  if (!renderedFrameRafId || typeof window === "undefined") return;
  window.cancelAnimationFrame(renderedFrameRafId);
  renderedFrameRafId = 0;
  renderedFrameNeedsSpacer = false;
  renderedFrameNeedsBottomState = false;
}

function scheduleRenderedFrameUpdate(options = {}) {
  emit("content-rendered");

  const needsSpacer = options.spacer !== false;
  renderedFrameNeedsSpacer = renderedFrameNeedsSpacer || needsSpacer;
  renderedFrameNeedsBottomState =
    renderedFrameNeedsBottomState || options.bottomState === true;

  if (typeof window === "undefined") {
    updateOverlayScrollbarFrame();
    if (renderedFrameNeedsSpacer) recalculateFocusSpacerHeight();
    if (renderedFrameNeedsBottomState) updateBottomState();
    renderedFrameNeedsSpacer = false;
    renderedFrameNeedsBottomState = false;
    return;
  }

  if (renderedFrameRafId) return;

  renderedFrameRafId = window.requestAnimationFrame(() => {
    renderedFrameRafId = 0;
    updateOverlayScrollbarFrame();
    if (renderedFrameNeedsSpacer) recalculateFocusSpacerHeight();
    if (renderedFrameNeedsBottomState) updateBottomState();
    renderedFrameNeedsSpacer = false;
    renderedFrameNeedsBottomState = false;
  });
}

// -------------------------------------------------------------------------
// Latest user-message lookup and focus spacer integration
// -------------------------------------------------------------------------
let latestChatUserCache = null;
let latestChatUserCacheKey = "";

function getLatestChatUserKey() {
  const list = props.messages || [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    const message = list[index];
    if (message?.role === "user") {
      return String(message.id ?? `user-${index}`);
    }
  }
  return "";
}

function getLatestChatUserElement() {
  const el = getScrollElement();
  if (!el) return null;

  const cacheKey = getLatestChatUserKey();
  if (
    cacheKey &&
    latestChatUserCacheKey === cacheKey &&
    latestChatUserCache &&
    el.contains(latestChatUserCache)
  ) {
    return latestChatUserCache;
  }

  let target = null;
  if (cacheKey) {
    const escapedKey =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(cacheKey)
        : cacheKey.replace(/"/g, '\\"');
    target = el.querySelector(`[data-message-id="${escapedKey}"]`);
  }

  // ID 기반 조회가 실패한 예외 케이스에서만 전체 DOM 검색으로 폴백합니다.
  // 긴 대화방 resize 중 querySelectorAll을 반복하면 프레임이 크게 밀릴 수 있습니다.
  if (!target) {
    const userMessages = el.querySelectorAll(
      '[data-message-role="user"], article.message--user, .message--user'
    );
    target = userMessages.length ? userMessages[userMessages.length - 1] : null;
  }

  latestChatUserCacheKey = cacheKey;
  latestChatUserCache = target;
  return target;
}

function resetLatestChatUserCache() {
  latestChatUserCache = null;
  latestChatUserCacheKey = "";
}

const streamFocusSpacerHeight = ref(0);

function getElementTopInScroll(container, target) {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  return container.scrollTop + targetRect.top - containerRect.top;
}

function recalculateFocusSpacerHeight(options = {}) {
  if (!props.loading) {
    streamFocusSpacerHeight.value = 0;
    return;
  }

  const el = getScrollElement();
  const target = getLatestChatUserElement();
  if (!el || !target) {
    streamFocusSpacerHeight.value = 0;
    return;
  }

  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const currentSpacer = streamFocusSpacerHeight.value || 0;
  const naturalScrollHeight = Math.max(0, el.scrollHeight - currentSpacer);
  const targetTop = getElementTopInScroll(el, target);
  const requiredSpacer = Math.ceil(
    targetTop - offset + el.clientHeight - naturalScrollHeight
  );
  const maxUsefulSpacer = Math.max(0, el.clientHeight - offset);

  streamFocusSpacerHeight.value = Math.max(
    0,
    Math.min(requiredSpacer, maxUsefulSpacer)
  );
}

async function refreshFocusSpacerAfterRender(options = {}) {
  await nextTick();
  recalculateFocusSpacerHeight(options);
}

// -------------------------------------------------------------------------
// Bottom state and message target controller
// -------------------------------------------------------------------------
function isNearBottom() {
  const el = getScrollElement();
  if (!el) return true;

  const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
  return remaining <= BOTTOM_THRESHOLD;
}

function updateBottomState() {
  userIsAtBottom.value = isNearBottom();
}

function getSafeScrollTop(container, top) {
  if (!container) return 0;
  const maxScrollTop = Math.max(
    0,
    container.scrollHeight - container.clientHeight
  );
  const numeric = Number(top);
  return Math.min(
    maxScrollTop,
    Math.max(0, Number.isFinite(numeric) ? numeric : 0)
  );
}

function scrollMessageListToBottom({behavior = "auto"} = {}) {
  const el = getScrollElement();
  if (!el) return false;

  const bottom = bottomRef.value;
  if (bottom?.scrollIntoView) {
    bottom.scrollIntoView({block: "end", inline: "nearest", behavior});
  }

  el.scrollTop = getSafeScrollTop(el, el.scrollHeight - el.clientHeight);
  updateBottomState();
  return true;
}

function scrollToFirstMessage({behavior = "auto"} = {}) {
  const el = getScrollElement();
  if (!el) return false;

  const target = getFirstMessageElement(scrollRef.value || el);
  if (!target) {
    el.scrollTop = 0;
    updateBottomState();
    return true;
  }

  const top = getElementOffsetTopWithinScroll(target, el);
  const nextTop = getSafeScrollTop(el, top);
  if (typeof el.scrollTo === "function") {
    el.scrollTo({top: nextTop, behavior});
  } else {
    el.scrollTop = nextTop;
  }
  updateBottomState();
  return true;
}

function scrollToMessage(
  messageId,
  {behavior = "auto", block = "center"} = {}
) {
  const el = getScrollElement();
  if (!el) return false;

  const target = findMessageElementById(scrollRef.value || el, messageId);
  if (!target) return false;

  const targetTop = getElementOffsetTopWithinScroll(target, el);
  const nextTop =
    block === "center"
      ? targetTop - el.clientHeight / 2 + target.offsetHeight / 2
      : targetTop - 16;
  const safeTop = getSafeScrollTop(el, nextTop);

  if (typeof el.scrollTo === "function") {
    el.scrollTo({top: safeTop, behavior});
  } else {
    el.scrollTop = safeTop;
  }
  updateBottomState();
  return true;
}

function applyScrollTarget(scrollTarget = {}, options = {}) {
  const type = scrollTarget?.type || MESSAGE_SCROLL_TARGET_TYPES.bottom;
  const behavior = options.behavior || scrollTarget.behavior || "auto";

  if (type === MESSAGE_SCROLL_TARGET_TYPES.message) {
    return scrollToMessage(scrollTarget.messageId, {
      behavior,
      block: scrollTarget.block || options.block || "center",
    });
  }

  if (type === MESSAGE_SCROLL_TARGET_TYPES.first) {
    return scrollToFirstMessage({behavior});
  }

  return scrollMessageListToBottom({behavior});
}

function applyElementScroll(target, options = {}) {
  const el = getScrollElement();
  if (!el || !target) return false;

  const ancestors = getScrollableAncestors(target);
  const scrollTargets = [el, ...ancestors].filter(
    (item, index, array) => item && array.indexOf(item) === index
  );

  let applied = false;
  scrollTargets.forEach((container) => {
    applied = scrollElementToTarget(container, target, options) || applied;
  });

  applyWindowFallbackScroll(target, el.getBoundingClientRect(), options);
  updateBottomState();
  return applied;
}

function scrollToLatestChatUser(options = {}) {
  clearStableTimers();

  if (props.historyRendering) return;

  const target = getLatestChatUserElement();
  if (!target) return;

  const applyLatestUserAnchor = (anchorOptions = options) => {
    recalculateFocusSpacerHeight(anchorOptions);
    updateOverlayScrollbarFrame();
    return applyElementScroll(target, anchorOptions);
  };

  const applied = applyLatestUserAnchor(options);
  if (!applied) return;

  // 자동 스크롤 OFF + 질문/재생성 직후에는 마지막 질문 박스가 화면 상단에
  // 보여야 합니다. 이때 하단 spacer ref를 먼저 계산해도 DOM에는 다음 tick/paint에
  // 반영되므로, 즉시 scroll만 수행하면 브라우저가 최대 scrollTop으로 clamp하여
  // 질문 박스가 중간/하단에 머무를 수 있습니다.
  // 따라서 manual stream의 최초 앵커 이동에 한해서 spacer DOM 반영 후 짧게 재적용합니다.
  // 예약 타이머는 stableScrollTimerIds로 관리하여 사용자가 wheel/touch로 스크롤하면
  // handleUserScrollIntent()에서 즉시 취소되므로 답변 수신 중 수동 스크롤은 존중됩니다.
  if (props.loading) {
    const delays = options.initialOnly ? [0, 32, 80] : [0, 32, 80, 160];
    delays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        scheduleTrackedAnimationFrame(() => {
          applyLatestUserAnchor({...options, behavior: "auto"});
        });
      }, delay);
      stableScrollTimerIds.push(timerId);
    });
    return;
  }

  if (!options.stable) return;

  const delays = options.keyboardOpenOnSubmit
    ? KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS
    : STABLE_SCROLL_DELAYS;

  delays.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      scheduleTrackedAnimationFrame(() => {
        applyLatestUserAnchor({...options, behavior: "auto"});
      });
    }, delay);
    stableScrollTimerIds.push(timerId);
  });
}

function scrollToInitialTarget(scrollTarget = {}, options = {}) {
  clearStableTimers();
  return applyScrollTarget(scrollTarget || {type: "bottom"}, {
    behavior: "auto",
    block: "center",
    ...options,
  });
}

// -------------------------------------------------------------------------
// History-render scroll policy
// -------------------------------------------------------------------------
function shouldApplyHistoryRenderScroll() {
  return props.historyRendering === true;
}

// -------------------------------------------------------------------------
// User scroll handling
// -------------------------------------------------------------------------
function handleScroll() {
  updateBottomState();
}

// -------------------------------------------------------------------------
// Scheduler cleanup and history render reset helpers
// -------------------------------------------------------------------------
function clearStableTimers() {
  stableScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  stableScrollTimerIds = [];
  clearTrackedAnimationFrames();
}

function clearHistoryRenderState() {
  historyRenderRunId += 1;
  clearStableTimers();
  clearAfterRenderScrollState();
  clearRenderedFrameScheduler();
  historyRenderCompleting = false;
  resetHistoryRenderLifecycleState();
}

// -------------------------------------------------------------------------
// Message identity and user-scroll intent helpers
// -------------------------------------------------------------------------
function getHistoryRenderMessageKey(message, index) {
  return String(message?.id ?? `${message?.role || "message"}-${index}`);
}

function getChatResponseIds() {
  return (props.messages || [])
    .map((message, index) => ({message, index}))
    .filter(({message}) => message?.role === "assistant")
    .map(({message, index}) => getHistoryRenderMessageKey(message, index));
}

function createHistoryRenderDomIndex() {
  const root = scrollRef.value;
  const messages = props.messages || [];
  const messageElements = root?.isConnected
    ? Array.from(root.querySelectorAll("[data-message-id]"))
    : [];
  const elementById = new Map();

  messageElements.forEach((element) => {
    const id = element.getAttribute("data-message-id");
    if (id && !elementById.has(id)) {
      elementById.set(id, element);
    }
  });

  return {
    root,
    messages,
    messageElements,
    elementById,
  };
}

function getHistoryRenderMessageElementFromIndex(domIndex, message, index) {
  if (!domIndex?.root?.isConnected) return null;

  const key = getHistoryRenderMessageKey(message, index);
  const exactElement = domIndex.elementById.get(key);
  if (exactElement?.isConnected) return exactElement;

  const fallbackElement = domIndex.messageElements[index];
  if (
    fallbackElement?.isConnected &&
    String(fallbackElement.getAttribute("data-message-role") || "") ===
      String(message?.role || "")
  ) {
    return fallbackElement;
  }

  return null;
}

function hasRenderedMarkdownElement(element, selector) {
  const target = element?.querySelector?.(selector);
  if (!target) return false;

  if (target.getAttribute("data-markdown-rendered") !== "true") {
    return false;
  }

  return target.childNodes.length > 0 || target.textContent.trim().length > 0;
}

function isHistoryRenderMessageMarkdownReady(domIndex, index) {
  const message = domIndex?.messages?.[index];
  if (!message) return false;

  const element = getHistoryRenderMessageElementFromIndex(
    domIndex,
    message,
    index
  );
  if (!element?.isConnected) return false;

  if (message?.role !== "assistant" || isAssistantErrorMessage(message)) {
    return true;
  }

  if (message?.reasoningContent) {
    if (
      !hasRenderedMarkdownElement(element, ".reasoning-content.markdown-body")
    ) {
      return false;
    }
  }

  if (message?.content) {
    if (!hasRenderedMarkdownElement(element, ".bubble-content.markdown-body")) {
      return false;
    }
  }

  return true;
}

function isHistoryRenderContentReady(domIndex = createHistoryRenderDomIndex()) {
  const {messages} = domIndex;
  for (let index = 0; index < messages.length; index += 1) {
    if (!isHistoryRenderMessageMarkdownReady(domIndex, index)) {
      return false;
    }
  }
  return true;
}

function isHistoryRenderRootLayoutReady(root) {
  if (!root?.isConnected) return false;

  const scrollElement = getScrollElement();
  const layoutTarget = scrollElement || root;
  const rect = layoutTarget.getBoundingClientRect?.();

  return Boolean(
    rect &&
    rect.width > 0 &&
    rect.height > 0 &&
    layoutTarget.clientWidth > 0 &&
    layoutTarget.clientHeight > 0
  );
}

function isHistoryRenderDomReady(domIndex = createHistoryRenderDomIndex()) {
  const {root, messages, messageElements} = domIndex;
  if (!root?.isConnected) return false;
  if (!isHistoryRenderRootLayoutReady(root)) return false;
  if (!props.historyMessagesReady) return false;
  if (messageElements.length < messages.length) return false;

  for (let index = 0; index < messages.length; index += 1) {
    if (
      !getHistoryRenderMessageElementFromIndex(domIndex, messages[index], index)
        ?.isConnected
    ) {
      return false;
    }
  }

  return true;
}

function isHistoryRenderMarkdownReady(
  domIndex = createHistoryRenderDomIndex()
) {
  return (
    isHistoryRenderDomReady(domIndex) && isHistoryRenderContentReady(domIndex)
  );
}

function isHistoryRenderPostProcessReady(
  domIndex = createHistoryRenderDomIndex()
) {
  return isHistoryRenderMarkdownReady(domIndex);
}

let afterRenderScrollRafId = 0;
let pendingAfterRenderAssistantIds = null;
let pendingAfterRenderOptions = null;

function clearAfterRenderScrollScheduler() {
  if (!afterRenderScrollRafId || typeof window === "undefined") return;
  window.cancelAnimationFrame(afterRenderScrollRafId);
  afterRenderScrollRafId = 0;
}

function clearAfterRenderScrollState() {
  clearAfterRenderScrollScheduler();
  pendingAfterRenderAssistantIds = null;
  pendingAfterRenderOptions = null;
}

function applyBottomScroll(behavior = "auto") {
  if (scrollMessageListToBottom({behavior})) {
    userIsAtBottom.value = true;
  }
}

function shouldAutoHistoryRenderBottomScroll() {
  // 대화방 이력 진입 시에는 메시지 렌더 정책의 초기 스크롤 대상으로 이동합니다.
  return props.historyRendering === true;
}

function applyHistoryRenderInitialScrollTarget(options = {}) {
  if (!shouldAutoHistoryRenderBottomScroll()) return;
  if (!shouldApplyHistoryRenderScroll?.(options)) return;

  const target = props.messageRenderPolicy?.scrollTarget || {type: "bottom"};
  const applied = applyScrollTarget(target, {
    behavior: "auto",
    block: "center",
  });

  if (target?.type === "bottom") {
    userIsAtBottom.value = true;
  } else {
    updateBottomState();
  }

  return applied;
}

function applyHistoryRenderBottomScroll() {
  return applyHistoryRenderInitialScrollTarget();
}

function applyBottomScrollAfterRender() {
  const options = pendingAfterRenderOptions || {};
  clearAfterRenderScrollState();

  scheduleTrackedAnimationFrame(() => {
    scheduleTrackedAnimationFrame(() => {
      applyBottomScroll(options.behavior || "auto");
    });
  });
}

function scheduleAfterRenderScrollFallback() {
  clearAfterRenderScrollScheduler();
  if (typeof window === "undefined") {
    applyBottomScrollAfterRender();
    return;
  }

  // 고정 시간 타이머 fallback 대신 렌더 이벤트가 누락된 예외 케이스만
  // 다음 paint에서 한 번 보정합니다. history render 경로에서는 호출되지 않습니다.
  afterRenderScrollRafId = window.requestAnimationFrame(() => {
    afterRenderScrollRafId = 0;
    if (pendingAfterRenderAssistantIds) {
      applyBottomScrollAfterRender();
    }
  });
}

function scrollToBottomAfterRender(options = {}) {
  clearStableTimers();
  clearAfterRenderScrollState();

  const assistantIds = getChatResponseIds();

  pendingAfterRenderOptions = {...options, force: true, stable: false};
  pendingAfterRenderAssistantIds = new Set(assistantIds);

  if (!pendingAfterRenderAssistantIds.size) {
    applyBottomScrollAfterRender();
    return;
  }

  scheduleAfterRenderScrollFallback();
}

function scrollToBottom(options = {}) {
  const force = options.force === true;
  const stable = options.stable === true;
  const behavior = options.behavior || "auto";

  if (props.historyRendering) {
    clearStableTimers();
    applyHistoryRenderBottomScroll();
    return;
  }

  if (!force && !userIsAtBottom.value) return;

  clearStableTimers();
  applyBottomScroll(behavior);

  if (!stable) return;

  STABLE_SCROLL_DELAYS.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      applyBottomScroll("auto");
    }, delay);
    stableScrollTimerIds.push(timerId);
  });
}

function handlePendingAfterRenderMessageRendered(messageId) {
  if (!pendingAfterRenderAssistantIds) return false;

  pendingAfterRenderAssistantIds.delete(String(messageId ?? ""));
  if (!pendingAfterRenderAssistantIds.size) {
    applyBottomScrollAfterRender();
  }
  return true;
}

function getIsAtBottom() {
  updateBottomState();
  return userIsAtBottom.value;
}

// -------------------------------------------------------------------------
// History render post-processing and lifecycle sequence
// -------------------------------------------------------------------------
function isCurrentHistoryRenderRun(runId) {
  return runId === historyRenderRunId && props.historyRendering;
}

async function waitForChatResponsePostProcess(runId) {
  await nextTick();
  if (!isCurrentHistoryRenderRun(runId)) return false;

  await waitAnimationFrames(1);
  if (!isCurrentHistoryRenderRun(runId)) return false;

  updateOverlayScrollbarFrame();
  applyHistoryRenderBottomScroll();
  return true;
}

function getHistoryRenderLayoutMetrics() {
  const el = getScrollElement();
  const bottom = bottomRef.value;
  if (!el) {
    return "no-scroll-element";
  }

  const bottomRect = bottom?.getBoundingClientRect?.();
  return [
    Math.round(el.scrollHeight),
    Math.round(el.clientHeight),
    Math.round(el.scrollTop),
    bottomRect ? Math.round(bottomRect.top) : "no-bottom",
    bottomRect ? Math.round(bottomRect.height) : "no-bottom-height",
  ].join(":");
}


async function waitForHistoryRenderLayoutStability(runId) {
  const isAndroid = isAndroidHistoryRenderRuntime();
  const requiredStableFrames = isAndroid
    ? HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES
    : HISTORY_RENDER_LAYOUT_STABLE_FRAMES;
  const maxFrames = isAndroid
    ? HISTORY_RENDER_ANDROID_LAYOUT_MAX_FRAMES
    : HISTORY_RENDER_LAYOUT_MAX_FRAMES;
  let previousMetrics = "";
  let stableFrames = 0;

  for (let frame = 0; frame < maxFrames; frame += 1) {
    if (!isCurrentHistoryRenderRun(runId)) return false;

    await waitAnimationFrames(1);
    if (!isCurrentHistoryRenderRun(runId)) return false;

    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
    await nextTick();
    if (!isCurrentHistoryRenderRun(runId)) return false;

    const metrics = getHistoryRenderLayoutMetrics();
    if (metrics === previousMetrics) {
      stableFrames += 1;
    } else {
      stableFrames = 0;
      previousMetrics = metrics;
    }

    if (stableFrames >= requiredStableFrames) {
      return true;
    }
  }

  updateOverlayScrollbarFrame();
  applyHistoryRenderBottomScroll();
  return true;
}

function finalizeHistoryRenderPostProcess() {
  updateOverlayScrollbarFrame();
  applyHistoryRenderBottomScroll();
}

function resetHistoryRenderLifecycleState() {}

async function waitForHistoryRenderDomReady(runId) {
  const maxFrames = isAndroidHistoryRenderRuntime()
    ? HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES
    : HISTORY_RENDER_DOM_READY_MAX_FRAMES;
  let stableFrames = 0;

  for (let frame = 0; frame < maxFrames; frame += 1) {
    if (!isCurrentHistoryRenderRun(runId)) return false;

    await nextTick();
    updateOverlayScrollbarFrame();

    if (isHistoryRenderPostProcessReady(createHistoryRenderDomIndex())) {
      stableFrames += 1;
      if (stableFrames >= HISTORY_RENDER_READY_STABLE_FRAMES) return true;
    } else {
      stableFrames = 0;
    }

    await waitAnimationFrames(1);
  }

  return isHistoryRenderPostProcessReady(createHistoryRenderDomIndex());
}

async function runHistoryRenderThenScrollSequence(runId) {
  try {
    if (!isCurrentHistoryRenderRun(runId)) return;

    await nextTick();
    if (!isCurrentHistoryRenderRun(runId)) return;

    setupOverlayScrollbar();
    updateOverlayScrollbarFrame();

    await waitForHistoryRenderDomReady(runId);
    if (!isCurrentHistoryRenderRun(runId)) return;

    await waitForChatResponsePostProcess(runId);
    if (!isCurrentHistoryRenderRun(runId)) return;

    recalculateFocusSpacerHeight();
    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();

    await waitForHistoryRenderLayoutStability(runId);
    if (!isCurrentHistoryRenderRun(runId)) return;

    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
    await nextTick();
    await waitAnimationFrames(2);
    applyHistoryRenderBottomScroll();
    updateBottomState();
  } finally {
    historyRenderCompleting = false;
    if (isCurrentHistoryRenderRun(runId)) {
      finalizeHistoryRenderPostProcess();
      handleHistoryRendered();
      emit("history-rendered");
    }
  }
}

function handleUserScrollIntent() {
  clearStableTimers();
  clearAfterRenderScrollState();
  if (!props.historyRendering) {
    clearHistoryRenderState();
  }
}

function addUserScrollIntentListeners(targetWindow = window) {
  if (!targetWindow) return;
  targetWindow.addEventListener("touchstart", handleUserScrollIntent, {
    passive: true,
  });
  targetWindow.addEventListener("wheel", handleUserScrollIntent, {
    passive: true,
  });
  targetWindow.addEventListener("keydown", handleUserScrollIntent);
}

function removeUserScrollIntentListeners(targetWindow = window) {
  if (!targetWindow) return;
  targetWindow.removeEventListener("touchstart", handleUserScrollIntent);
  targetWindow.removeEventListener("wheel", handleUserScrollIntent);
  targetWindow.removeEventListener("keydown", handleUserScrollIntent);
}

// -------------------------------------------------------------------------
// Resize recalculation scheduling controller
// -------------------------------------------------------------------------
let resizeRecalculateTimerId = 0;
let resizeRecalculateRafId = 0;

function runResizeRecalculateFrame() {
  recalculateFocusSpacerHeight();
  updateOverlayScrollbarFrame();
  updateBottomState();
}

function clearResizeRecalculateScheduler() {
  if (resizeRecalculateTimerId) {
    window.clearTimeout(resizeRecalculateTimerId);
    resizeRecalculateTimerId = 0;
  }
  if (resizeRecalculateRafId) {
    window.cancelAnimationFrame(resizeRecalculateRafId);
    resizeRecalculateRafId = 0;
  }
}

function scheduleResizeRecalculate() {
  if (typeof window === "undefined") {
    recalculateFocusSpacerHeight();
    return;
  }

  // 대화방 입장 history render 중에는 고정 시간 debounce를 사용하지 않습니다.
  // 화면은 hidden 상태에서 렌더/scroll 안정화 루프가 순차 진행하므로,
  // resize observer가 끼어들어도 다음 paint에서 한 번만 보정합니다.
  clearResizeRecalculateScheduler();
  if (props.historyRendering) {
    resizeRecalculateRafId = window.requestAnimationFrame(() => {
      resizeRecalculateRafId = 0;
      runResizeRecalculateFrame();
    });
    return;
  }

  // 긴 대화방(250~1000개)에서 resize 이벤트가 연속 발생할 때마다
  // scrollHeight/getBoundingClientRect/querySelectorAll 계열 계산을 수행하면
  // 화면 전환 반응이 크게 느려집니다. 마지막 resize 프레임 근처에서 한 번만
  // composer spacer와 OverlayScrollbars를 갱신합니다.
  resizeRecalculateTimerId = window.setTimeout(() => {
    resizeRecalculateTimerId = 0;
    resizeRecalculateRafId = window.requestAnimationFrame(() => {
      resizeRecalculateRafId = 0;
      runResizeRecalculateFrame();
    });
  }, RESIZE_RECALCULATE_DEBOUNCE_MS);
}

// -------------------------------------------------------------------------
// History render lifecycle sequence
// -------------------------------------------------------------------------
async function startHistoryRoomRender() {
  if (!props.historyRendering || !props.historyMessagesReady) return;
  if (historyRenderCompleting) return;

  clearHistoryRenderState();
  const runId = historyRenderRunId;
  historyRenderCompleting = true;

  await runHistoryRenderThenScrollSequence(runId);
}

// -------------------------------------------------------------------------
// Public scroll commands used by ChatHistory/ChatConversationWorkspace
// -------------------------------------------------------------------------
// Message rendered events and streaming scroll behavior
// -------------------------------------------------------------------------
function handleMessageRendered(payload) {
  const messageId = payload?.messageId ?? payload;

  if (props.historyRendering) {
    // 채팅방 입장 중에는 메시지별 rendered 이벤트를 누적 상태로 관리하지 않습니다.
    // API 완료 플래그가 켜진 뒤 startHistoryRoomRender()의 단일 try/finally 루프가
    // 현재 v-for DOM 전체를 순차 처리합니다.
    if (props.historyMessagesReady) startHistoryRoomRender();
    return;
  }

  scheduleRenderedFrameUpdate({spacer: !props.loading});

  if (handlePendingAfterRenderMessageRendered(messageId)) {
    return;
  }
}


// -------------------------------------------------------------------------
// Watchers and DOM lifecycle
// -------------------------------------------------------------------------
watch(
  () => [
    props.loading,
    props.messages.length,
    props.historyRendering,
    props.historyMessagesReady,
  ],
  ([loading, , historyRendering]) => {
    resetLatestChatUserCache();

    if (historyRendering) {
      // history render 중에는 content-rendered 이벤트/부모 타이머를 만들지 않고,
      // MessageList 내부 직렬 루프에서 overlay/scroll 상태만 갱신합니다.
      updateOverlayScrollbarFrame();
      return;
    }

    updateOverlayScrollbarFrame();

    // 답변 생성 중에는 질문 직후 scrollToLatestChatUser()가 계산한 spacer를 유지합니다.
    // watch에서 비동기로 다시 계산하면 답변 높이 변화와 맞물려 질문 박스가 흔들릴 수 있습니다.
    if (loading) return;

    refreshFocusSpacerAfterRender();
  }
);

watch(
  () => props.historyRenderKey,
  (nextKey, previousKey) => {
    if (nextKey === previousKey) return;
    clearHistoryRenderState();
  },
  {flush: "sync"}
);

watch(
  () => props.messages,
  async (nextMessages, previousMessages) => {
    if (!props.historyRendering || nextMessages === previousMessages) return;

    // 대화방 이동 중 이전 방 답변 후처리 루프가 아직 진행 중이면
    // 새 메시지 배열이 들어와도 historyRenderCompleting 때문에 새 방 렌더가
    // 시작되지 않을 수 있습니다. 메시지 소스가 바뀌는 즉시 기존 run을
    // 무효화해서 최신 방의 후처리만 진행되도록 합니다.
    clearHistoryRenderState();

    // 메시지 개수가 같은 방으로 이동하는 경우 length watcher가 다시 실행되지
    // 않을 수 있으므로, DOM 교체 tick 이후 최신 메시지 기준 후처리를 직접 시작합니다.
    if (props.historyMessagesReady) {
      await nextTick();
      startHistoryRoomRender();
    }
  },
  {flush: "sync"}
);

watch(
  () => [
    props.historyRendering,
    props.historyMessagesReady,
    props.messages.length,
  ],
  () => {
    if (props.historyRendering && props.historyMessagesReady) {
      startHistoryRoomRender();
    } else if (!props.historyRendering) {
      clearHistoryRenderState();
    }
  },
  {flush: "post"}
);

onMounted(() => {
  if (typeof window === "undefined") return;
  setupOverlayScrollbar();
  recalculateFocusSpacerHeight();
  if (props.historyRendering && props.historyMessagesReady)
    startHistoryRoomRender();
  window.addEventListener("resize", scheduleResizeRecalculate, {
    passive: true,
  });
  window.visualViewport?.addEventListener("resize", scheduleResizeRecalculate, {
    passive: true,
  });
  addUserScrollIntentListeners(window);
});

onBeforeUnmount(() => {
  clearStableTimers();
  clearAfterRenderScrollState();
  clearHistoryRenderState();
  clearRenderedFrameScheduler();
  clearTrackedAnimationFrames();
  clearResizeRecalculateScheduler();
  cleanupOverlayScrollbar();
  if (typeof window === "undefined") return;
  window.removeEventListener("resize", scheduleResizeRecalculate);
  window.visualViewport?.removeEventListener(
    "resize",
    scheduleResizeRecalculate
  );
  removeUserScrollIntentListeners(window);
});

function getMessageListVerticalPadding(element) {
  if (!element || typeof window === "undefined") {
    return 0;
  }

  const style = window.getComputedStyle(element);
  const paddingTop = Number.parseFloat(style.paddingTop || "0") || 0;
  const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0;

  return paddingTop + paddingBottom;
}

function updateLastTurnSectorMinHeight() {
  if (lastTurnSectorResizeFrame) {
    cancelAnimationFrame(lastTurnSectorResizeFrame);
  }

  lastTurnSectorResizeFrame = requestAnimationFrame(() => {
    lastTurnSectorResizeFrame = 0;
    const element = scrollRef.value;
    const viewportHeight = Math.floor(element?.clientHeight || 0);
    const verticalPadding = Math.ceil(getMessageListVerticalPadding(element));
    const bottomAnchorHeight = Math.ceil(bottomRef.value?.offsetHeight || 0);

    lastTurnSectorMinHeight.value = Math.max(
      0,
      viewportHeight - verticalPadding - bottomAnchorHeight
    );
  });
}

onMounted(() => {
  nextTick(updateLastTurnSectorMinHeight);

  if (typeof ResizeObserver !== "undefined" && scrollRef.value) {
    lastTurnSectorResizeObserver = new ResizeObserver(() => {
      updateLastTurnSectorMinHeight();
    });
    lastTurnSectorResizeObserver.observe(scrollRef.value);
  }
});

onBeforeUnmount(() => {
  if (lastTurnSectorResizeFrame) {
    cancelAnimationFrame(lastTurnSectorResizeFrame);
    lastTurnSectorResizeFrame = 0;
  }

  if (lastTurnSectorResizeObserver) {
    lastTurnSectorResizeObserver.disconnect();
    lastTurnSectorResizeObserver = null;
  }
});

watch(
  () => [props.messages.length, props.loading],
  () => {
    nextTick(updateLastTurnSectorMinHeight);
  }
);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(updateLastTurnSectorMinHeight);
    }
  }
);



defineExpose({
  submit,
  regenerate,
  scrollToBottom,
  scrollToBottomAfterRender,
  scrollToLatestChatUser,
  scrollToInitialTarget,
  isAtBottom: getIsAtBottom,
  handleHistoryRendered,
});
</script>

<style scoped lang="scss">
.message-list {
  min-width: 0;
  min-height: 0;
  overflow-anchor: none;
}

.message-turn-sector {
  display: contents;
}

.message-turn-sector--last {
  display: flow-root;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.message-list--history-rendering {
  /*
   * Android 최초 진입 시 답변 후처리는 실제 DOM 레이아웃을 참조해 SVG를 계산합니다.
   * visibility:hidden / overflow:hidden / contain:paint 조합은 Android Chrome/WebView에서
   * 최초 1회 답변 후처리 레이아웃 계산이 실패하는 원인이 될 수 있어 사용하지 않습니다.
   * 화면 노출은 opacity로만 막고, DOM은 정상 레이아웃 상태로 유지합니다.
   */
  opacity: 0 !important;
  pointer-events: none !important;
  scroll-behavior: auto !important;
  overscroll-behavior: none !important;
  scrollbar-width: none !important;
  overflow-anchor: none;
}

:global(body.android-webview) .message-list,
:global(body.android-chrome) .message-list {
  /*
   * Lazy prepend 위치는 MessageList의 DOM anchor 보정으로만 처리합니다.
   * Android 브라우저 scroll anchoring과 수동 scrollTop 보정이 동시에 동작하면
   * lazy load 직후 viewport가 중간 위치로 튈 수 있습니다.
   */
  overflow-anchor: none;
}

.message-list--manual-stream {
  scroll-behavior: auto !important;
  overflow-anchor: none;
}

.message-list--manual-stream .typing-row,
.message-list--manual-stream .stream-focus-spacer,
.message-list--manual-stream .message-list-anchor {
  overflow-anchor: none;
}

.typing-row {
  flex: 0 0 auto;
}
.stream-focus-spacer {
  flex: 0 0 auto;
  width: 100%;
  pointer-events: none;
}
</style>
