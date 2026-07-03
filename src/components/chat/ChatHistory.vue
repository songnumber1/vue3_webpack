<template>
  <div v-show="props.visible" class="message-list-shell">
    <section
      ref="scrollRef"
      class="message-list"
      :class="{'message-list--hidden': !messageListReady}"
      aria-live="polite"
      :aria-busy="loading || !messageListReady ? 'true' : 'false'"
      @scroll.passive="handleScroll"
      @wheel.passive="cancelInitialScrollStabilizerByUser"
      @touchstart.passive="cancelInitialScrollStabilizerByUser"
      @pointerdown.passive="cancelInitialScrollStabilizerByUser"
    >
      <template v-for="message in messages" :key="message.id">
        <ChatUser
          v-if="message.role === 'user'"
          :data-message-id="message.id"
          :message="message"
          @rendered="handleMessageRendered"
        />
        <AssistantErrorMessage
          v-else-if="isAssistantErrorMessage(message)"
          :data-message-id="message.id"
          :message="message"
          @rendered="handleMessageRendered"
        />
        <template v-else>
          <ChatResponse
            :data-message-id="message.id"
            :message="message"
            :interaction-blocked="shouldBlockAssistantInteraction(message)"
            :show-regenerate="!readonly && isLastChatResponse(message)"
            @rendered="handleMessageRendered"
            @regenerate="regenerate"
          />
          <div
            v-if="getMessageTailSpacerHeight(message)"
            class="message-tail-spacer"
            :style="{height: `${getMessageTailSpacerHeight(message)}px`}"
            aria-hidden="true"
          ></div>
        </template>
      </template>

      <div v-if="loading" class="typing-row">
        <span></span><span></span><span></span>
      </div>
    </section>
  </div>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import ChatUser from "@/components/chat/ChatUser.vue";
import ChatResponse from "@/components/chat/ChatResponse.vue";
import AssistantErrorMessage from "@/components/chat/AssistantErrorMessage.vue";
import {ROUTE_NAMES, resolveRouteMode} from "@/constants/routeNames";
import {useStudioRuntimeStore} from "@/stores/studioRuntimeStore";
import {useChatStore} from "@/stores/chatStore";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {
  createChatHistory,
  loadChatHistoryList,
  loadChatMessageRouters,
} from "@/composables/chat/runtime/chatRuntimeApi";
import {
  createLocalHistory,
  createSessionFromHistory,
} from "@/composables/chat/runtime/chatSessionFactory";
import {resolveConversationSessionState} from "@/composables/chat/internal/policy/chatSessionPolicy";
import {enterNewSubmitChatRoom} from "@/composables/chat/chatRoomActions";
import {isSharedChat} from "@/composables/chat/internal/message-list/useMessageRenderPolicy";
import {logWarn} from "@/utils/logger";
import {createId} from "@/utils/id";
import {adaptChatHistoryItem as adaptChatHistory} from "@/adapters/chatResponseAdapter";
import {
  DEFAULT_API_BASE_PATH,
  SERVER_API_BASE_URL,
  shouldUseServerApi,
} from "@/constants/apiMode";
import {
  createChatUser,
  createChatResponse,
  createAssistantStreamingPatch,
  revokeMessageAttachments,
} from "@/composables/chat/chatMessageActions";
import {getSharedConversation} from "@/composables/chat/useSharedChat";
import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {SSE} from "@/api/sse/vendor/sse";
import {resolveSessionAuthConfig} from "@/auth/authPolicy";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";

const props = defineProps({
  visible: {type: Boolean, default: true},
});
const route = useRoute();
const router = useRouter();
const studioRuntimeStore = useStudioRuntimeStore();
const chatStore = useChatStore();
const promptControlStore = usePromptControlStore();
const routeMode = computed(() => resolveRouteMode(route.name));
const isMainPage = computed(() => routeMode.value === "main");
const isChatPage = computed(() => routeMode.value === "chat");
const isSharedPage = computed(() => routeMode.value === "shared");
const isConversationPage = computed(
  () => isChatPage.value || isSharedPage.value
);
const activeHistoryId = computed(() => {
  if (isChatPage.value) return chatStore.selectedChatId || null;
  if (isSharedPage.value) {
    if (chatStore.activeRoomType === ACTIVE_ROOM_TYPES.shared) {
      return chatStore.activeRoomId || null;
    }
    return route.params.id || route.params.shareId || null;
  }
  return null;
});
const activeHistory = computed(() => findHistory(activeHistoryId.value));
const readonly = computed(
  () =>
    isSharedPage.value ||
    chatStore.isActiveSharedRoom ||
    isSharedChat(activeHistory.value)
);
const messages = ref([]);
const loading = computed(() => chatStore.isWait);
const scrollRef = ref(null);
const messageListReady = ref(true);

const DONE_STREAM_MESSAGE = "[DONE]";
const GENERATION_STREAM_TIMEOUT_MS = 120000;
const HISTORY_RENDER_WAIT_TIMEOUT_MS = 1500;
let loadController = null;
let submittingChatId = null;
let currentRouteMode = null;
let currentHistoryId = null;
let historyRenderWait = null;
let historyRenderToken = 0;
let initialScrollStabilizer = null;
let initialScrollStabilizerFrame = 0;

function setMessages(nextMessages = []) {
  messages.value = nextMessages;
}

function clearMessages() {
  revokeMessageAttachments(messages.value);
  setMessages([]);
}

function getMessageTailSpacerHeight(message) {
  if (
    message?.role !== "assistant" ||
    message.error ||
    !message?.sectorMinHeight
  )
    return 0;
  return message.sectorMinHeight;
}

function clearMessagesOnConversationChange() {
  if (
    routeMode.value === currentRouteMode &&
    activeHistoryId.value === currentHistoryId
  )
    return;

  currentRouteMode = routeMode.value;
  currentHistoryId = activeHistoryId.value;
  resetHistoryRenderWait();
  messageListReady.value = !isConversationPage.value || !activeHistoryId.value;
  clearMessages();
}

function resetHistoryRenderWait() {
  if (historyRenderWait) {
    window.clearTimeout(historyRenderWait.timeoutId);
    historyRenderWait.resolve?.();
    historyRenderWait = null;
  }
  historyRenderToken += 1;
}

function stopInitialScrollStabilizer({finish = false} = {}) {
  if (initialScrollStabilizerFrame) {
    window.cancelAnimationFrame(initialScrollStabilizerFrame);
    initialScrollStabilizerFrame = 0;
  }

  if (!initialScrollStabilizer) return;

  const stabilizer = initialScrollStabilizer;
  window.clearTimeout(stabilizer.timeoutId);
  initialScrollStabilizer = null;

  if (finish && stabilizer.applied) {
    finishInitialScroll(stabilizer.request);
  }
}

function cancelInitialScrollStabilizerByUser() {
  stopInitialScrollStabilizer({finish: true});
}

function hasImageAttachment(message) {
  return (
    Array.isArray(message?.attachments) &&
    message.attachments.some((file) => file?.kind === "image")
  );
}

function createHistoryRenderWait(nextMessages = []) {
  resetHistoryRenderWait();

  const expected = nextMessages
    .filter(
      (message) => message?.role === "assistant" || hasImageAttachment(message)
    )
    .map((message) => message.id)
    .filter(Boolean);
  const token = historyRenderToken;

  if (expected.length === 0) {
    return {token, promise: nextTick()};
  }

  const pending = new Set(expected);
  const promise = new Promise((resolve) => {
    const timeoutId = window.setTimeout(() => {
      if (historyRenderWait?.token !== token) return;
      historyRenderWait = null;
      resolve();
    }, HISTORY_RENDER_WAIT_TIMEOUT_MS);

    historyRenderWait = {token, pending, resolve, timeoutId};
  });

  return {token, promise};
}

function finishHistoryRenderWait() {
  if (!historyRenderWait) return;

  const {resolve, timeoutId} = historyRenderWait;
  window.clearTimeout(timeoutId);
  historyRenderWait = null;
  resolve?.();
}

function markHistoryMessageRendered(payload = {}) {
  if (!historyRenderWait || !payload?.messageId) return;
  if (!["enhanced", "error", "attachment"].includes(payload.type)) return;

  historyRenderWait.pending.delete(payload.messageId);
  if (historyRenderWait.pending.size > 0) return;

  finishHistoryRenderWait();
}

function startHistoryRenderPresentation() {
  messageListReady.value = false;
}

function finishHistoryRenderPresentation() {
  messageListReady.value = true;
}

function cancelHistoryRenderPresentation() {
  messageListReady.value = true;
  resetHistoryRenderWait();
  stopInitialScrollStabilizer();
}

function getDefaultInitialScrollRequest() {
  if (chatStore.searchTargetMessageId) {
    return {type: "message", messageId: chatStore.searchTargetMessageId};
  }

  if (isSharedPage.value || isSharedChat(activeHistory.value)) {
    return {type: "top", messageId: null};
  }

  return {type: "last", messageId: null};
}

function createInitialScrollRequest() {
  const storedRequest = chatStore.consumeInitialScrollRequest();
  if (storedRequest?.type) {
    return {
      type: storedRequest.type,
      messageId: storedRequest.messageId || null,
    };
  }

  return getDefaultInitialScrollRequest();
}

async function renderLoadedMessages(nextMessages = [], signal) {
  startHistoryRenderPresentation();
  const initialScrollRequest = createInitialScrollRequest();
  const renderWait = createHistoryRenderWait(nextMessages);
  startInitialScrollStabilizer(initialScrollRequest, signal);
  setMessages(nextMessages);

  await nextTick();
  await renderWait.promise;
  await nextTick();

  if (signal?.aborted) return;

  await applyInitialScrollSequence(initialScrollRequest, signal);
  if (signal?.aborted) return;

  finishHistoryRenderPresentation();
  await nextTick();

  const applied = await applyInitialScrollSequence(
    initialScrollRequest,
    signal
  );
  if (signal?.aborted) return;

  if (!initialScrollStabilizer && applied) {
    finishInitialScroll(initialScrollRequest);
  }
}

function findHistory(chatId) {
  if (!chatId) return null;
  return (
    chatStore.histories.find((history) => history.chatId === chatId) || null
  );
}

function getSharedEntryId() {
  if (
    ![ROUTE_NAMES.SHARED_ENTRY, ROUTE_NAMES.SHARE_CHAT_ENTRY].includes(
      route.name
    )
  ) {
    return null;
  }
  return route.params.id || route.params.shareId;
}

function isAbortError(error) {
  return error?.name === "AbortError" || error?.code === "ERR_CANCELED";
}

function abortLoadRequest() {
  loadController?.abort?.();
  loadController = null;
}

function createLoadSignal() {
  abortLoadRequest();
  loadController =
    typeof AbortController === "function" ? new AbortController() : null;
  return loadController?.signal;
}

async function refreshHistories() {
  const chatHistories = await loadChatHistoryList({
    assistantMap: chatStore.assistantMap,
    modelMap: chatStore.modelMap,
  });
  chatStore.setHistories(chatHistories);
  return chatHistories;
}

async function findHistoryForLoad(chatId) {
  let history = findHistory(chatId);
  if (history) return history;
  await refreshHistories();
  return findHistory(chatId);
}

async function loadHistoryMessages(history, signal) {
  const session = createSessionFromHistory(
    history,
    chatStore.modelMap,
    chatStore.assistantMap
  );
  const sessionState = resolveConversationSessionState(
    history,
    session,
    chatStore.assistantMap,
    chatStore.assistants,
    studioRuntimeStore,
    false
  );
  const activeSession = sessionState.session || session;

  if (sessionState.nextSelectedAssistantId) {
    chatStore.selectAssistant(sessionState.nextSelectedAssistantId);
  }

  chatStore.setActiveSession(activeSession);

  return loadChatMessageRouters(
    {
      chatId: history.chatId,
      assistId: activeSession.assistantId,
      modelId: activeSession.modelId,
      studio: activeSession.assistantType === "studio",
    },
    {signal}
  );
}

async function loadChatConversation(signal) {
  if (
    chatStore.isWait &&
    submittingChatId &&
    activeHistoryId.value === submittingChatId
  )
    return;

  if (isMainPage.value) {
    clearMessages();
    chatStore.clearActiveSession();
    return;
  }

  if (!activeHistoryId.value) {
    clearMessages();
    return;
  }

  const history = await findHistoryForLoad(activeHistoryId.value);
  if (!history) {
    clearMessages();
    chatStore.clearActiveSession();
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
    return;
  }

  chatStore.setActiveChatRoom(history.chatId);
  const nextMessages = await loadHistoryMessages(history, signal);
  if (signal?.aborted) return;
  await renderLoadedMessages(nextMessages, signal);
}

async function loadSharedConversation(signal) {
  const sharedId = getSharedEntryId() || activeHistoryId.value;
  if (!sharedId) {
    clearMessages();
    return;
  }

  const result = await getSharedConversation(sharedId, {signal});
  if (!result.exists) {
    clearMessages();
    chatStore.clearActiveRoom();
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
    return;
  }

  chatStore.setActiveSharedRoom(result.shareId || sharedId);
  if (route.name === ROUTE_NAMES.SHARED_ENTRY) {
    await router.replace({name: ROUTE_NAMES.SHARED}).catch(() => {});
  }

  await renderLoadedMessages(result.messages, signal);
}

async function loadConversation() {
  if (!isConversationPage.value && !isMainPage.value) return;

  const shouldLock =
    isConversationPage.value && !chatStore.isWait && !chatStore.input;
  if (shouldLock) chatStore.startWait();

  const signal = createLoadSignal();

  try {
    if (isSharedPage.value) {
      await loadSharedConversation(signal);
      return;
    }
    await loadChatConversation(signal);
  } catch (error) {
    if (!isAbortError(error))
      logWarn("[ChatHistory] loadConversation 오류:", error);
  } finally {
    loadController = null;
    if (shouldLock) chatStore.finishWait();
  }
}

function getSubmitAssistantId() {
  return chatStore.activeSession?.assistantId || chatStore.selectedAssistantId;
}

function getSubmitModelId() {
  return chatStore.activeSession?.modelId || chatStore.selectedModelId;
}

function isSelectedModelReasoning() {
  return Boolean(chatStore.modelMap[getSubmitModelId()]?.isReasoning);
}

function createGenerationPayload(promptPayload, chatId) {
  const settings = promptControlStore.activePromptToolSettings || {};
  const knowledgeSearch = settings.knowledgeSearch || [];

  return {
    [G.CHAT_ID]: chatId,
    [G.ASSIST_ID]: getSubmitAssistantId(),
    [G.MODEL_ID]: getSubmitModelId(),
    [G.STUDIO]: false,
    [G.INTENTION]: "직접입력",
    [G.RAG]: knowledgeSearch.length > 0,
    [G.RAG_COT]: false,
    [G.IMAGE_S3_PATH_LEGACY]: null,
    [G.SOURCE_TYPE]: "internal",
    [G.ARRAY_OPTIONS]: knowledgeSearch,
    [G.MESSAGE_FILE_HISTORY]: null,
    [G.STYLES]: [],
    [G.BODY]: promptPayload.text,
    [G.BYTE_SIZE]: 10000,
    [G.LAST_FEDERATION_INFO]: null,
    [G.UI_STATE_INFO_WRAPPER]: null,
    [G.MESSAGE_ID]: createId("message"),
    [G.RESPONSE_MESSAGE_ID]: createId("message"),
  };
}

function createParserError(error) {
  const parserError = error instanceof Error ? error : new Error(String(error));
  parserError.parser = true;
  return parserError;
}

function parseJson(data) {
  try {
    return JSON.parse(data);
  } catch (error) {
    throw createParserError(error);
  }
}

function readStreamObject(data) {
  const parsed = parseJson(data);
  if (typeof parsed.raw === "string" && parsed.raw.startsWith("{")) {
    return parseJson(parsed.raw);
  }
  if (parsed.raw && typeof parsed.raw === "object") return parsed.raw;
  return parsed;
}

function isDoneStream(parsed) {
  return parsed.done === true || parsed.finish_reason === "stop";
}

function createGenerationTimeoutError() {
  const error = new Error("generation stream timed out");
  error.timeout = true;
  return error;
}

function createAssistantStreamError(error) {
  return {
    status: "error",
    error: true,
    errorTitle: error.timeout ? "답변 생성 시간 초과" : "답변 파싱 실패",
    errorMessage: error.timeout
      ? "답변 생성 시간이 초과되었습니다."
      : "응답 데이터를 처리하는 중 오류가 발생했습니다.",
    errorCode: error.timeout ? "SSE_TIMEOUT" : "SSE_PARSER_ERROR",
    reasoningStatus: "completed",
    content: "",
  };
}

async function generationMock(payload, handlers) {
  const text = pickGenerationSample(payload[G.BODY]);

  await streamText(
    text,
    (chunk) => {
      handlers.onContent(chunk);
    },
    {delay: 18}
  );

  handlers.onComplete();
}

function getGenerationUrl() {
  const base = shouldUseServerApi()
    ? SERVER_API_BASE_URL
    : DEFAULT_API_BASE_PATH;
  const endpoint = API_ENDPOINTS.GENERATION;
  return `${base.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`;
}

function getSseOptions(payload) {
  const policy = resolveSessionAuthConfig();

  return {
    start: false,
    method: "POST",
    withCredentials: true,
    autoReconnect: false,
    headers: {
      "X-Client-Platform": policy.platform,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      "Cache-Control": "no-cache",
    },
    payload: JSON.stringify(payload),
  };
}

async function generationSse(payload, handlers) {
  let source = null;
  let contentText = "";
  let reasoningText = "";
  const model = chatStore.modelMap[getSubmitModelId()];

  const mergeStreamText = (current, next) => {
    if (!next) return current;
    if (!current || next.startsWith(current)) return next;
    if (next === current) return current;
    return current + next;
  };

  const createCompleteParser = (finish) => () => {
    handlers.onComplete();
    source?.close?.();
    finish();
  };

  const llmParser = (finish) => {
    const completeStream = createCompleteParser(finish);

    return (data) => {
      if (data === DONE_STREAM_MESSAGE) {
        completeStream();
        return;
      }

      if (!data?.startsWith?.("{")) {
        contentText = mergeStreamText(contentText, data);
        handlers.onContent(contentText);
        return;
      }

      const parsed = readStreamObject(data);
      if (isDoneStream(parsed)) {
        completeStream();
        return;
      }

      contentText = mergeStreamText(
        contentText,
        parsed.choices?.[0]?.delta?.content ||
          parsed.delta?.content ||
          parsed.choices?.[0]?.message?.content ||
          parsed.data?.content ||
          parsed.message?.content ||
          parsed.content ||
          parsed.answer ||
          parsed.text
      );
      handlers.onContent(contentText);
    };
  };

  const reasoningParser = (finish) => {
    const completeStream = createCompleteParser(finish);

    return (data) => {
      if (data === DONE_STREAM_MESSAGE) {
        completeStream();
        return;
      }

      const parsed = readStreamObject(data);
      if (isDoneStream(parsed)) {
        completeStream();
        return;
      }

      const delta = parsed.choices?.[0]?.delta || parsed.delta || {};
      reasoningText = mergeStreamText(
        reasoningText,
        delta.reasoning_content ||
          delta.reasoningContent ||
          delta.reasoning ||
          parsed.reasoningContent ||
          parsed.reasoning
      );
      handlers.onReasoning?.(reasoningText);

      contentText = mergeStreamText(
        contentText,
        parsed.choices?.[0]?.delta?.content ||
          parsed.delta?.content ||
          parsed.choices?.[0]?.message?.content ||
          parsed.data?.content ||
          parsed.message?.content ||
          parsed.content ||
          parsed.answer ||
          parsed.text
      );
      handlers.onContent(contentText);
    };
  };

  const ragParser = (finish) => {
    const completeStream = createCompleteParser(finish);

    return (data) => {
      if (data === DONE_STREAM_MESSAGE) {
        completeStream();
        return;
      }

      const parsed = readStreamObject(data);
      if (isDoneStream(parsed)) {
        completeStream();
        return;
      }

      contentText = mergeStreamText(
        contentText,
        parsed.choices?.[0]?.delta?.content ||
          parsed.delta?.content ||
          parsed.choices?.[0]?.message?.content ||
          parsed.data?.content ||
          parsed.message?.content ||
          parsed.content ||
          parsed.answer ||
          parsed.text
      );
      handlers.onContent(contentText);
      handlers.onExtra?.({
        duo: parsed.duo,
        ragimage: parsed.ragimage || parsed.ragImage || parsed.ragimages,
      });
    };
  };

  await new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      source?.close?.();
      reject(createGenerationTimeoutError());
    }, GENERATION_STREAM_TIMEOUT_MS);

    const finish = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    const fail = (error) => {
      clearTimeout(timeoutId);
      source?.close?.();
      reject(error);
    };

    let parser = llmParser(finish);
    if (model?.isReasoning) parser = reasoningParser(finish);
    if (model?.hasRag) parser = ragParser(finish);

    source = new SSE(getGenerationUrl(), getSseOptions(payload));
    source.onmessage = (event) => {
      try {
        parser(event.data);
      } catch (error) {
        fail(error);
      }
    };
    source.onerror = () => finish();
    source.stream();
  });
}

async function generation(payload, handlers) {
  if (!shouldUseServerApi()) {
    await generationMock(payload, handlers);
    return;
  }

  await generationSse(payload, handlers);
}

function createRemoteConversation(promptPayload) {
  const chatId = createId();
  const assistantId = getSubmitAssistantId();
  const assistant = chatStore.assistantMap[assistantId];

  return createChatHistory({
    chatId,
    assistId: assistantId,
    modelId: getSubmitModelId(),
    ChatTilte: promptPayload.text.slice(0, 20) || promptPayload.text,
    studio: assistant?.type === "studio",
  }).then((rawHistory) => {
    const history = adaptChatHistory(rawHistory, {
      assistantMap: chatStore.assistantMap,
      modelMap: chatStore.modelMap,
    });
    if (!history.chatId)
      throw new Error("new.do response does not contain chatId.");
    return history;
  });
}

function createLocalConversation(promptPayload) {
  return createLocalHistory(
    promptPayload.text,
    chatStore.currentAssistant,
    chatStore.currentModel || chatStore.currentModels[0]
  );
}

async function createConversation(promptPayload) {
  const history = shouldUseServerApi()
    ? await createRemoteConversation(promptPayload)
    : createLocalConversation(promptPayload);

  chatStore.addHistory(history);
  chatStore.setActiveSession(
    createSessionFromHistory(
      history,
      chatStore.modelMap,
      chatStore.assistantMap
    )
  );
  return history;
}

function shouldCreateConversation(chatId = chatStore.selectedChatId) {
  return !chatId;
}

function createPromptPayload(payload = {}) {
  return {
    text: payload.text || "",
    attachments: payload.attachments || [],
    keyboardOpenOnSubmit: Boolean(payload.keyboardOpenOnSubmit),
  };
}

function isEmptyPromptPayload(promptPayload) {
  return !promptPayload.text && promptPayload.attachments.length === 0;
}

function isSubmitBlocked(promptPayload) {
  return (
    chatStore.isActiveSharedRoom ||
    !canSubmitChatMessage() ||
    isEmptyPromptPayload(promptPayload)
  );
}

function addUserAndAssistantMessages(promptPayload) {
  const userMessage = createChatUser(promptPayload);
  const assistantMessage = createChatResponse(
    createAssistantStreamingPatch(isSelectedModelReasoning())
  );

  setMessages([...messages.value, userMessage, assistantMessage]);

  return {userMessage, assistantMessage};
}

async function prepareSubmitChatId(promptPayload) {
  if (!shouldCreateConversation()) {
    const chatId = chatStore.selectedChatId;
    submittingChatId = chatId;
    void refreshHistories();
    return chatId;
  }

  const history = await createConversation(promptPayload);
  const chatId = history.chatId;
  submittingChatId = chatId;
  promptControlStore.promoteDraftPromptToolSettingsToChat(chatId);
  await refreshHistories();
  await enterNewSubmitChatRoom(router, chatId);
  return chatId;
}

async function scrollToQuestionStart(userMessage, assistantMessage) {
  await nextTick();
  updateQuestionSector(userMessage, assistantMessage);
  await nextTick();
  scrollToMessage(userMessage.id, "start");
  await waitAnimationFrame();
  scrollToMessage(userMessage.id, "start");
}

async function appendSubmitMessages(promptPayload) {
  const messagesPair = addUserAndAssistantMessages(promptPayload);
  await waitForSubmitKeyboardSettle(promptPayload);
  await scrollToQuestionStart(
    messagesPair.userMessage,
    messagesPair.assistantMessage
  );
  return messagesPair;
}

function createGenerationHandlers(assistantMessage) {
  return {
    onContent: (content) => appendAssistantContent(assistantMessage, content),
    onReasoning: (content) =>
      appendAssistantReasoning(assistantMessage, content),
    onExtra: (extra) => updateAssistantExtra(assistantMessage, extra),
    onComplete: () => completeAssistantMessage(assistantMessage),
  };
}

async function runSubmitGeneration(promptPayload, chatId, assistantMessage) {
  await generation(
    createGenerationPayload(promptPayload, chatId),
    createGenerationHandlers(assistantMessage)
  );
  completeAssistantMessage(assistantMessage);
}

function handleSubmitGenerationError(error, assistantMessage) {
  if (
    assistantMessage?.role === "assistant" &&
    (error.timeout || error.parser)
  ) {
    updateAssistantMessage(assistantMessage, {
      ...createAssistantStreamError(error),
      sectorMinHeight: 0,
    });
    return;
  }

  if (!isAbortError(error)) logWarn("[ChatHistory] generation 종료:", error);
}

function updateAssistantMessage(assistantMessage, patch) {
  let nextAssistantMessage = assistantMessage;

  setMessages(
    messages.value.map((message) => {
      if (message.id !== assistantMessage.id) return message;
      nextAssistantMessage = {...message, ...patch};
      return nextAssistantMessage;
    })
  );

  Object.assign(assistantMessage, nextAssistantMessage);
}

function completeAssistantMessage(assistantMessage) {
  updateAssistantMessage(assistantMessage, {
    status: "complete",
    reasoningStatus: "completed",
  });
}

function appendAssistantContent(assistantMessage, content) {
  updateAssistantMessage(assistantMessage, {
    content,
    reasoningStatus: "completed",
  });
}

function appendAssistantReasoning(assistantMessage, reasoningContent) {
  updateAssistantMessage(assistantMessage, {
    reasoningContent,
    reasoningStatus: "thinking",
  });
}

function updateAssistantExtra(assistantMessage, extra = {}) {
  const patch = {};
  if (Array.isArray(extra.duo)) patch.duo = extra.duo;
  if (Array.isArray(extra.ragimage)) patch.ragimage = extra.ragimage;
  if (Object.keys(patch).length > 0)
    updateAssistantMessage(assistantMessage, patch);
}

function canSubmitChatMessage() {
  return (
    !readonly.value &&
    !chatStore.isWait &&
    !chatStore.activeSession?.isModelUnavailable
  );
}

async function submit(payload) {
  const promptPayload = createPromptPayload(payload);
  if (isSubmitBlocked(promptPayload)) return;

  chatStore.startWait();
  let assistantMessage = null;

  try {
    const chatId = await prepareSubmitChatId(promptPayload);
    const submitMessages = await appendSubmitMessages(promptPayload);
    assistantMessage = submitMessages.assistantMessage;
    await runSubmitGeneration(promptPayload, chatId, assistantMessage);
  } catch (error) {
    handleSubmitGenerationError(error, assistantMessage);
  } finally {
    submittingChatId = null;
    chatStore.finishWait();
  }
}

async function submitStoreInput(payload) {
  await submit(payload);
  if (chatStore.input === payload) chatStore.clearInput();
}

function findChatUserForRegenerate(assistantMessage) {
  const assistantIndex = messages.value.findIndex(
    (message) => message.id === assistantMessage.id
  );
  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    if (messages.value[index].role === "user") return messages.value[index];
  }
  return null;
}

async function regenerate(assistantMessage) {
  if (!canSubmitChatMessage()) return;

  const chatId = chatStore.selectedChatId;
  const userMessage = findChatUserForRegenerate(assistantMessage);
  if (!chatId || !userMessage) return;

  const assistantIndex = messages.value.findIndex(
    (message) => message.id === assistantMessage.id
  );
  const nextAssistantMessage = createChatResponse(
    createAssistantStreamingPatch(isSelectedModelReasoning())
  );
  setMessages([
    ...messages.value.slice(0, assistantIndex),
    nextAssistantMessage,
  ]);
  await scrollToQuestionStart(userMessage, nextAssistantMessage);

  chatStore.startWait();
  try {
    await runSubmitGeneration(
      {text: userMessage.content, attachments: userMessage.attachments || []},
      chatId,
      nextAssistantMessage
    );
  } catch (error) {
    if (error.timeout || error.parser) {
      updateAssistantMessage(nextAssistantMessage, {
        ...createAssistantStreamError(error),
        sectorMinHeight: 0,
      });
    } else if (!isAbortError(error)) {
      logWarn("[ChatHistory] regenerate 종료:", error);
    }
  } finally {
    chatStore.finishWait();
  }
}

function isStreamingAssistantMessage(message) {
  return (
    message?.role === "assistant" &&
    Boolean(message.status) &&
    !["complete", "error"].includes(message.status)
  );
}

function shouldBlockAssistantInteraction(message) {
  return chatStore.isWait && isStreamingAssistantMessage(message);
}

function isAssistantErrorMessage(message) {
  return message?.role === "assistant" && message?.error;
}

function isLastChatResponse(message) {
  if (!message || message.role !== "assistant") return false;

  for (let index = messages.value.length - 1; index >= 0; index -= 1) {
    const current = messages.value[index];
    if (current.role === "assistant") return current.id === message.id;
  }

  return false;
}

function getScrollElement() {
  return scrollRef.value;
}

function scrollWithAutoBehavior(callback) {
  const element = getScrollElement();
  if (!element) return false;

  const previousScrollBehavior = element.style.scrollBehavior;
  element.style.scrollBehavior = "auto";
  callback(element);
  element.style.scrollBehavior = previousScrollBehavior;
  updateBottomState();
  return true;
}

function scrollToTop() {
  return scrollWithAutoBehavior((element) => {
    element.scrollTop = 0;
  });
}

function scrollToBottom() {
  return scrollWithAutoBehavior((element) => {
    element.scrollTop = element.scrollHeight;
  });
}

function getMessageIdentityValues(message) {
  return [
    message?.id,
    message?.raw?.id,
    message?.raw?.msgId,
    message?.raw?.respMsgId,
    message?.raw?.messageId,
    message?.raw?.targetMessageId,
    message?.raw?.message_id,
  ].filter((value) => value !== null && value !== undefined && value !== "");
}

function findMessageByIdentity(messageId) {
  const targetId = String(messageId || "");
  if (!targetId) return null;
  return messages.value.find((message) =>
    getMessageIdentityValues(message).some(
      (value) => String(value) === targetId
    )
  );
}

function findMessageElement(messageId) {
  const element = getScrollElement();
  const message = findMessageByIdentity(messageId);
  if (!element || !message?.id) return null;
  return element.querySelector(`[data-message-id="${message.id}"]`);
}

function scrollElementIntoView(target, block = "center") {
  return scrollWithAutoBehavior((element) => {
    const targetTop = target.offsetTop;
    const targetHeight = target.offsetHeight;
    const maxScrollTop = Math.max(
      element.scrollHeight - element.clientHeight,
      0
    );
    let nextTop = targetTop;

    if (block === "center") {
      nextTop =
        targetTop - Math.max((element.clientHeight - targetHeight) / 2, 0);
    }

    if (block === "end") {
      nextTop = targetTop + targetHeight - element.clientHeight;
    }

    element.scrollTop = Math.max(0, Math.min(nextTop, maxScrollTop));
  });
}

function clearAssistantSectorHeights(exceptMessageId = "") {
  const exceptId = String(exceptMessageId || "");
  let changed = false;
  const nextMessages = messages.value.map((message) => {
    if (
      message.role !== "assistant" ||
      !message.sectorMinHeight ||
      String(message.id) === exceptId
    ) {
      return message;
    }
    changed = true;
    return {...message, sectorMinHeight: 0};
  });

  if (changed) setMessages(nextMessages);
}

function updateQuestionSector(userMessage, assistantMessage) {
  const element = getScrollElement();
  const userElement = findMessageElement(userMessage.id);
  if (!element || !userElement) return;

  clearAssistantSectorHeights(assistantMessage.id);

  const sectorMinHeight = Math.max(
    element.clientHeight - userElement.offsetHeight - 22,
    0
  );
  updateAssistantMessage(assistantMessage, {sectorMinHeight});
}

function scrollToMessage(messageId, block = "center") {
  const target = findMessageElement(messageId);
  if (!target) return false;
  return scrollElementIntoView(target, block);
}

function isMobileMode() {
  if (typeof document === "undefined") return false;
  return document.body?.classList?.contains("mobile-mode");
}

function readRootPxVar(name) {
  if (typeof window === "undefined" || typeof document === "undefined")
    return 0;
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name);
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getKeyboardViewportGap() {
  if (typeof window === "undefined" || typeof document === "undefined")
    return 0;

  const visualHeight = window.visualViewport?.height || 0;
  const layoutHeight = Math.max(
    window.innerHeight || 0,
    document.documentElement?.clientHeight || 0,
    readRootPxVar("--layout-viewport-height"),
    readRootPxVar("--app-height")
  );
  const cssKeyboardHeight = Math.max(
    readRootPxVar("--keyboard-height"),
    readRootPxVar("--mobile-keyboard-inset"),
    readRootPxVar("--composer-keyboard-inset")
  );

  return Math.max(
    cssKeyboardHeight,
    visualHeight > 0 ? layoutHeight - visualHeight : 0
  );
}

async function waitMilliseconds(milliseconds) {
  await new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function waitForSubmitKeyboardSettle(promptPayload) {
  if (!promptPayload?.keyboardOpenOnSubmit || !isMobileMode()) return;

  const startedAt = performance.now();
  while (performance.now() - startedAt < 700) {
    await waitAnimationFrame();
    if (getKeyboardViewportGap() <= 48) break;
  }

  await waitMilliseconds(80);
  await nextTick();
  await waitAnimationFrame();
}

function waitAnimationFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function shouldStabilizeInitialScroll(request = {}) {
  return ["message", "last", "bottom"].includes(request.type);
}

function getInitialScrollSignature(request = {}) {
  const element = getScrollElement();
  if (!element) return "";

  if (request.type === "message") {
    const target = findMessageElement(request.messageId);
    return [
      element.scrollHeight,
      element.clientHeight,
      target?.offsetTop ?? "missing",
      target?.offsetHeight ?? 0,
    ].join(":");
  }

  return [element.scrollHeight, element.clientHeight].join(":");
}

function isInitialScrollStabilizerStable(stabilizer, signature) {
  if (!signature) {
    stabilizer.stableFrames = 0;
    stabilizer.lastSignature = "";
    return false;
  }

  if (signature === stabilizer.lastSignature) {
    stabilizer.stableFrames += 1;
  } else {
    stabilizer.lastSignature = signature;
    stabilizer.stableFrames = 0;
  }

  const elapsed = performance.now() - stabilizer.startedAt;
  return elapsed >= 700 && stabilizer.stableFrames >= 36;
}

function startInitialScrollStabilizer(request, signal) {
  stopInitialScrollStabilizer();

  if (!shouldStabilizeInitialScroll(request)) return;

  initialScrollStabilizer = {
    request,
    signal,
    applied: false,
    startedAt: performance.now(),
    lastSignature: "",
    stableFrames: 0,
    timeoutId: 0,
  };

  initialScrollStabilizer.timeoutId = window.setTimeout(() => {
    const active = initialScrollStabilizer;
    if (active && !active.applied && active.request?.type === "message") {
      active.applied = scrollToTop();
    }
    stopInitialScrollStabilizer({finish: true});
  }, 20000);

  scheduleInitialScrollStabilizerApply();
}

function scheduleInitialScrollStabilizerApply({finish = false} = {}) {
  const stabilizer = initialScrollStabilizer;
  if (!stabilizer || stabilizer.signal?.aborted) return;

  if (initialScrollStabilizerFrame) return;

  initialScrollStabilizerFrame = window.requestAnimationFrame(() => {
    initialScrollStabilizerFrame = 0;
    const active = initialScrollStabilizer;
    if (!active || active.signal?.aborted) return;

    const applied = applyInitialScroll(active.request);
    active.applied = applied || active.applied;

    const signature = getInitialScrollSignature(active.request);
    const stable =
      active.applied && isInitialScrollStabilizerStable(active, signature);

    if (finish || stable) {
      stopInitialScrollStabilizer({finish: true});
      return;
    }

    scheduleInitialScrollStabilizerApply();
  });
}

function handleInitialScrollStabilizerRendered() {
  scheduleInitialScrollStabilizerApply();
}

function finishInitialScroll(request = {}) {
  if (request.type === "message") chatStore.clearSearchTargetMessageId();
}

function applyInitialScroll(request = createInitialScrollRequest()) {
  if (request.type === "message") {
    if (!request.messageId) return false;
    return scrollToMessage(request.messageId, "center");
  }

  if (request.type === "top" || request.type === "first") {
    return scrollToTop();
  }

  if (request.type === "last" || request.type === "bottom") {
    return scrollToBottom();
  }

  return scrollToBottom();
}

async function applyInitialScrollSequence(request, signal) {
  let applied = applyInitialScroll(request);

  await nextTick();
  if (signal?.aborted) return applied;
  applied = applyInitialScroll(request) || applied;

  await waitAnimationFrame();
  if (signal?.aborted) return applied;
  applied = applyInitialScroll(request) || applied;

  if (!applied && request?.type === "message") {
    return scrollToTop();
  }

  return applied;
}
function isNearBottom() {
  const element = getScrollElement();
  if (!element) return true;
  return element.scrollHeight - element.scrollTop - element.clientHeight <= 24;
}

function updateBottomState() {
  chatStore.setShowScrollBottom(isConversationPage.value && !isNearBottom());
}

function handleScroll() {
  updateBottomState();
}

function handleMessageRendered(payload) {
  markHistoryMessageRendered(payload);
  handleInitialScrollStabilizerRendered(payload);
}

watch(
  () => chatStore.scrollRequestSeq,
  async () => {
    const request = chatStore.scrollRequest;
    if (!request) return;

    await nextTick();

    if (request.type === "top") {
      scrollToTop();
      return;
    }

    if (request.type === "message") {
      scrollToMessage(request.messageId);
      return;
    }

    scrollToBottom();
  }
);

watch(
  () => chatStore.input,
  async (payload) => {
    if (!payload) return;
    await submitStoreInput(payload);
  },
  {immediate: true}
);

watch(
  () => [
    chatStore.selectedChatId,
    chatStore.activeRoomId,
    chatStore.activeRoomType,
    activeHistoryId.value,
    route.params.id,
    route.params.shareId,
    routeMode.value,
  ],
  async () => {
    clearMessagesOnConversationChange();
    await loadConversation();
  },
  {immediate: true}
);

onBeforeUnmount(() => {
  abortLoadRequest();
  cancelHistoryRenderPresentation();
  clearMessages();
});

defineExpose({});
</script>

<style scoped lang="scss">
.message-list {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overflow-anchor: none;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}

.message-list--hidden {
  visibility: hidden;
  pointer-events: none;
}

.message-tail-spacer {
  flex: 0 0 auto;
  min-height: 0;
  pointer-events: none;
}

.typing-row {
  flex: 0 0 auto;
}
</style>
