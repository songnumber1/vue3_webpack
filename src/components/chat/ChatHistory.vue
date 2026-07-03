<template>
  <div v-show="visible" class="message-list-shell">
    <section ref="scrollRef" class="message-list" aria-live="polite" :aria-busy="loading ? 'true' : 'false'"
      @scroll.passive="handleScroll">
      <template v-for="message in messages" :key="message.id">
        <ChatUser v-if="message.role === 'user'" :data-message-id="message.id" :data-message-raw-id="message.raw?.id"
          :data-message-msg-id="message.raw?.msgId" :data-message-resp-id="message.raw?.respMsgId"
          :data-message-search-id="message.raw?.messageId || message.raw?.targetMessageId"
          :data-message-message-id="message.raw?.message_id" :data-message-role="message.role" :message="message"
          @rendered="handleMessageRendered" />
        <AssistantErrorMessage v-else-if="isAssistantErrorMessage(message)" :style="getMessageStyle(message)"
          :data-message-id="message.id" :data-message-raw-id="message.raw?.id" :data-message-msg-id="message.raw?.msgId"
          :data-message-resp-id="message.raw?.respMsgId"
          :data-message-search-id="message.raw?.messageId || message.raw?.targetMessageId"
          :data-message-message-id="message.raw?.message_id" :data-message-role="message.role" :message="message"
          @rendered="handleMessageRendered" />
        <ChatResponse v-else :style="getMessageStyle(message)" :data-message-id="message.id"
          :data-message-raw-id="message.raw?.id" :data-message-msg-id="message.raw?.msgId"
          :data-message-resp-id="message.raw?.respMsgId"
          :data-message-search-id="message.raw?.messageId || message.raw?.targetMessageId"
          :data-message-message-id="message.raw?.message_id" :data-message-role="message.role" :message="message"
          :show-regenerate="!readonly && isLastChatResponse(message)" @rendered="handleMessageRendered"
          @regenerate="regenerate" />
      </template>

      <div v-if="loading" class="typing-row">
        <span></span><span></span><span></span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import ChatUser from "@/components/chat/ChatUser.vue";
import ChatResponse from "@/components/chat/ChatResponse.vue";
import AssistantErrorMessage from "@/components/chat/AssistantErrorMessage.vue";
import { useAppBootstrap } from "@/composables/app/useAppBootstrap";
import { ROUTE_NAMES, resolveRouteMode } from "@/constants/routeNames";
import { useStudioRuntimeStore } from "@/stores/studioRuntimeStore";
import { useChatStore } from "@/stores/chatStore";
import { usePromptControlStore } from "@/stores/promptControlStore";
import {
  createChatHistory,
  loadChatHistoryList,
  loadChatMessageRouters,
} from "@/composables/chat/runtime/chatRuntimeApi";
import {
  createLocalHistory,
  createSessionFromHistory,
} from "@/composables/chat/runtime/chatSessionFactory";
import { resolveConversationSessionState } from "@/composables/chat/internal/policy/chatSessionPolicy";
import { resolveActiveChatId, enterNewSubmitChatRoom } from "@/composables/chat/chatRoomActions";
import { isSharedChat } from "@/composables/chat/internal/message-list/useMessageRenderPolicy";
import { logWarn } from "@/utils/logger";
import { createId } from "@/utils/id";
import { adaptChatHistoryItem as adaptChatHistory } from "@/adapters/chatResponseAdapter";
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
import { getSharedConversation } from "@/composables/chat/useSharedChat";
import { API_ENDPOINTS } from "@/constants/apiEndpoints";
import { pickGenerationSample } from "@/api/mock/data/generationSamples.raw";
import { streamText } from "@/api/mock/fakeStream";
import { SSE } from "@/api/sse/vendor/sse";
import { resolveSessionAuthConfig } from "@/auth/authPolicy";
import { GENERATION_API_KEYS as G } from "@/constants/api/generationApiKeys";

const props = defineProps({
  visible: { type: Boolean, default: true },
});
const emit = defineEmits(["content-rendered", "history-rendered"]);

const route = useRoute();
const router = useRouter();
const appBootstrap = useAppBootstrap();
const studioRuntimeStore = useStudioRuntimeStore();
const chatStore = useChatStore();
const promptControlStore = usePromptControlStore();
const { histories } = storeToRefs(chatStore);

const visible = computed(() => props.visible);
const routeMode = computed(() => resolveRouteMode(route.name));
const isMainPage = computed(() => routeMode.value === "main");
const isChatPage = computed(() => routeMode.value === "chat");
const isSharedPage = computed(() => routeMode.value === "shared");
const isConversationPage = computed(() => isChatPage.value || isSharedPage.value);
const activeHistoryId = computed(() => {
  if (isChatPage.value) return resolveActiveChatId();
  if (isSharedPage.value) return chatStore.activeRoomId || route.params.id || route.params.shareId;
  return null;
});
const activeHistory = computed(() => findHistory(activeHistoryId.value));
const readonly = computed(
  () => isSharedPage.value || chatStore.isActiveSharedRoom || isSharedChat(activeHistory.value)
);
const messages = ref([]);
const loading = computed(() => chatStore.isWait);
const scrollRef = ref(null);
const pendingSearchScrollId = ref(null);

const DONE_STREAM_MESSAGE = "[DONE]";
const GENERATION_STREAM_TIMEOUT_MS = 120000;
let loadController = null;
let submittingChatId = null;
let searchScrollTimer = null;
let currentRouteMode = null;
let currentHistoryId = null;

function setMessages(nextMessages = []) {
  messages.value = nextMessages;
}

function clearMessages() {
  revokeMessageAttachments(messages.value);
  setMessages([]);
}

function getMessageStyle(message) {
  if (!message?.sectorMinHeight) return null;
  return { minHeight: `${message.sectorMinHeight}px` };
}

function clearSearchScrollTimer() {
  if (!searchScrollTimer) return;
  clearTimeout(searchScrollTimer);
  searchScrollTimer = null;
}

function clearMessagesOnConversationChange() {
  if (routeMode.value === currentRouteMode && activeHistoryId.value === currentHistoryId) return;

  currentRouteMode = routeMode.value;
  currentHistoryId = activeHistoryId.value;
  pendingSearchScrollId.value = chatStore.searchTargetMessageId;
  clearMessages();
}

function findHistory(chatId) {
  if (!chatId) return null;
  return histories.value.find((history) => history.chatId === chatId) || null;
}

function getSharedEntryId() {
  if (route.name !== ROUTE_NAMES.SHARED_ENTRY) return null;
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
  loadController = typeof AbortController === "function" ? new AbortController() : null;
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
    { signal }
  );
}

async function loadChatConversation(signal) {
  if (chatStore.isWait && submittingChatId && activeHistoryId.value === submittingChatId) return;

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
    await router.replace({ name: ROUTE_NAMES.MAIN }).catch(() => { });
    return;
  }

  chatStore.setActiveChatRoom(history.chatId);
  setMessages(await loadHistoryMessages(history, signal));
  await applyInitialScroll();
  emit("history-rendered");
}

async function loadSharedConversation(signal) {
  const sharedId = getSharedEntryId() || activeHistoryId.value;
  if (!sharedId) {
    clearMessages();
    return;
  }

  const result = await getSharedConversation(sharedId, { signal });
  if (!result.exists) {
    clearMessages();
    chatStore.clearActiveRoom();
    await router.replace({ name: ROUTE_NAMES.MAIN }).catch(() => { });
    return;
  }

  chatStore.setActiveSharedRoom(result.shareId || sharedId);
  if (route.name === ROUTE_NAMES.SHARED_ENTRY) {
    await router.replace({ name: ROUTE_NAMES.SHARED }).catch(() => { });
  }

  setMessages(result.messages);
  await applyInitialScroll();
  emit("history-rendered");
}

async function loadConversation() {
  if (!isConversationPage.value && !isMainPage.value) return;

  const shouldLock = isConversationPage.value && !chatStore.isWait && !chatStore.input;
  if (shouldLock) chatStore.startWait();

  const signal = createLoadSignal();

  try {
    if (isSharedPage.value) {
      await loadSharedConversation(signal);
      return;
    }
    await loadChatConversation(signal);
  } catch (error) {
    if (!isAbortError(error)) logWarn("[ChatHistory] loadConversation 오류:", error);
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
    { delay: 18 }
  );

  handlers.onComplete();
}

function getGenerationUrl() {
  const base = shouldUseServerApi() ? SERVER_API_BASE_URL : DEFAULT_API_BASE_PATH;
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

  const applyContent = (content) => {
    contentText = mergeStreamText(contentText, content);
    handlers.onContent(contentText);
  };

  const applyReasoning = (content) => {
    reasoningText = mergeStreamText(reasoningText, content);
    handlers.onReasoning?.(reasoningText);
  };

  const complete = (resolve) => {
    handlers.onComplete();
    source?.close?.();
    resolve();
  };

  const readContent = (parsed) =>
    parsed.choices?.[0]?.delta?.content ||
    parsed.delta?.content ||
    parsed.choices?.[0]?.message?.content ||
    parsed.data?.content ||
    parsed.message?.content ||
    parsed.content ||
    parsed.answer ||
    parsed.text;

  const llmParser = (data, resolve) => {
    if (data === DONE_STREAM_MESSAGE) {
      complete(resolve);
      return;
    }

    if (!data?.startsWith?.("{")) {
      applyContent(data);
      return;
    }

    const parsed = readStreamObject(data);
    if (isDoneStream(parsed)) {
      complete(resolve);
      return;
    }

    applyContent(readContent(parsed));
  };

  const reasoningParser = (data, resolve) => {
    if (data === DONE_STREAM_MESSAGE) {
      complete(resolve);
      return;
    }

    const parsed = readStreamObject(data);
    if (isDoneStream(parsed)) {
      complete(resolve);
      return;
    }

    const delta = parsed.choices?.[0]?.delta || parsed.delta || {};
    applyReasoning(
      delta.reasoning_content ||
      delta.reasoningContent ||
      delta.reasoning ||
      parsed.reasoningContent ||
      parsed.reasoning
    );
    applyContent(readContent(parsed));
  };

  const ragParser = (data, resolve) => {
    if (data === DONE_STREAM_MESSAGE) {
      complete(resolve);
      return;
    }

    const parsed = readStreamObject(data);
    if (isDoneStream(parsed)) {
      complete(resolve);
      return;
    }

    applyContent(readContent(parsed));
    handlers.onExtra?.({
      duo: parsed.duo,
      ragimage: parsed.ragimage || parsed.ragImage || parsed.ragimages,
    });
  };

  let parser = llmParser;
  if (model?.isReasoning) parser = reasoningParser;
  if (model?.hasRag) parser = ragParser;

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

    source = new SSE(getGenerationUrl(), getSseOptions(payload));
    source.onmessage = (event) => {
      try {
        parser(event.data, finish);
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
    if (!history.chatId) throw new Error("new.do response does not contain chatId.");
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
    createSessionFromHistory(history, chatStore.modelMap, chatStore.assistantMap)
  );
  return history;
}

function shouldCreateConversation() {
  return !resolveActiveChatId();
}

function createPromptPayload(payload) {
  return {
    text: payload.text,
    attachments: payload.attachments || [],
  };
}

function addUserAndAssistantMessages(promptPayload) {
  const userMessage = createChatUser(promptPayload);
  const assistantMessage = createChatResponse(
    createAssistantStreamingPatch(isSelectedModelReasoning())
  );

  setMessages([
    ...messages.value,
    userMessage,
    assistantMessage,
  ]);

  return { userMessage, assistantMessage };
}

function updateAssistantMessage(assistantMessage, patch) {
  let nextAssistantMessage = assistantMessage;

  setMessages(
    messages.value.map((message) => {
      if (message.id !== assistantMessage.id) return message;
      nextAssistantMessage = { ...message, ...patch };
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
  if (Object.keys(patch).length > 0) updateAssistantMessage(assistantMessage, patch);
}

function canSubmitChatMessage() {
  return !readonly.value && !chatStore.isWait && !chatStore.activeSession?.isModelUnavailable;
}

async function submit(payload) {
  const promptPayload = createPromptPayload(payload);
  if (
    chatStore.isActiveSharedRoom ||
    !canSubmitChatMessage() ||
    (!promptPayload.text && promptPayload.attachments.length === 0)
  ) {
    return;
  }

  chatStore.startWait();

  try {
    let chatId = resolveActiveChatId();

    if (shouldCreateConversation()) {
      const history = await createConversation(promptPayload);
      chatId = history.chatId;
      submittingChatId = chatId;
      promptControlStore.promoteDraftPromptToolSettingsToChat(chatId);
      await refreshHistories();
      await enterNewSubmitChatRoom(router, chatId);
    } else {
      submittingChatId = chatId;
      void refreshHistories();
    }

    const { userMessage, assistantMessage } = addUserAndAssistantMessages(promptPayload);
    await nextTick();
    updateQuestionSector(userMessage, assistantMessage);
    await nextTick();
    scrollToMessage(userMessage.id, "start");

    await generation(
      createGenerationPayload(promptPayload, chatId),
      {
        onContent: (content) => appendAssistantContent(assistantMessage, content),
        onReasoning: (content) => appendAssistantReasoning(assistantMessage, content),
        onExtra: (extra) => updateAssistantExtra(assistantMessage, extra),
        onComplete: () => completeAssistantMessage(assistantMessage),
      }
    );

    completeAssistantMessage(assistantMessage);
  } catch (error) {
    const assistantMessage = messages.value[messages.value.length - 1];
    if (assistantMessage?.role === "assistant" && (error.timeout || error.parser)) {
      updateAssistantMessage(assistantMessage, createAssistantStreamError(error));
    } else if (!isAbortError(error)) {
      logWarn("[ChatHistory] generation 종료:", error);
    }
  } finally {
    submittingChatId = null;
    chatStore.finishWait();
  }
}

async function submitStoreInput(payload) {
  chatStore.clearInput();
  await submit(payload);
}

function findChatUserForRegenerate(assistantMessage) {
  const assistantIndex = messages.value.findIndex((message) => message.id === assistantMessage.id);
  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    if (messages.value[index].role === "user") return messages.value[index];
  }
  return null;
}

async function regenerate(assistantMessage) {
  if (!canSubmitChatMessage()) return;

  const chatId = resolveActiveChatId();
  const userMessage = findChatUserForRegenerate(assistantMessage);
  if (!chatId || !userMessage) return;

  const assistantIndex = messages.value.findIndex((message) => message.id === assistantMessage.id);
  const nextAssistantMessage = createChatResponse(
    createAssistantStreamingPatch(isSelectedModelReasoning())
  );
  setMessages([...messages.value.slice(0, assistantIndex), nextAssistantMessage]);
  await nextTick();
  scrollToMessage(nextAssistantMessage.id);

  chatStore.startWait();
  try {
    await generation(
      createGenerationPayload(
        { text: userMessage.content, attachments: userMessage.attachments || [] },
        chatId
      ),
      {
        onContent: (content) => appendAssistantContent(nextAssistantMessage, content),
        onReasoning: (content) => appendAssistantReasoning(nextAssistantMessage, content),
        onExtra: (extra) => updateAssistantExtra(nextAssistantMessage, extra),
        onComplete: () => completeAssistantMessage(nextAssistantMessage),
      }
    );
    completeAssistantMessage(nextAssistantMessage);
  } catch (error) {
    if (error.timeout || error.parser) {
      updateAssistantMessage(nextAssistantMessage, createAssistantStreamError(error));
    } else if (!isAbortError(error)) {
      logWarn("[ChatHistory] regenerate 종료:", error);
    }
  } finally {
    chatStore.finishWait();
  }
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

function scrollToTop() {
  const element = getScrollElement();
  if (element) element.scrollTop = 0;
  updateBottomState();
}

function scrollToBottom() {
  const element = getScrollElement();
  if (element) element.scrollTop = element.scrollHeight;
  updateBottomState();
}

function findMessageElement(messageId) {
  const element = getScrollElement();
  if (!element || !messageId) return null;
  return element.querySelector(`[data-message-id="${messageId}"]`);
}

function updateQuestionSector(userMessage, assistantMessage) {
  const element = getScrollElement();
  const userElement = findMessageElement(userMessage.id);
  if (!element || !userElement) return;

  const userHeight = userElement.getBoundingClientRect().height;
  const sectorMinHeight = Math.max(element.clientHeight - userHeight - 22, 0);
  updateAssistantMessage(assistantMessage, { sectorMinHeight });
}

function scrollToMessage(messageId, block = "center") {
  const element = getScrollElement();
  if (!element || !messageId) return false;

  const targetId = String(messageId);
  const target = Array.from(element.querySelectorAll("[data-message-id]")).find((node) =>
    [
      node.dataset.messageId,
      node.dataset.messageRawId,
      node.dataset.messageMsgId,
      node.dataset.messageRespId,
      node.dataset.messageSearchId,
      node.dataset.messageMessageId,
    ].some((id) => id && String(id) === targetId)
  );

  if (!target) return false;
  target.scrollIntoView({ block });
  updateBottomState();
  return true;
}

function scheduleSearchScroll() {
  if (!pendingSearchScrollId.value) return;
  clearSearchScrollTimer();
  searchScrollTimer = setTimeout(() => {
    searchScrollTimer = null;
    if (scrollToMessage(pendingSearchScrollId.value)) {
      pendingSearchScrollId.value = null;
      chatStore.clearSearchTargetMessageId();
    }
  }, 160);
}

async function applyInitialScroll() {
  await nextTick();
  if (chatStore.searchTargetMessageId) {
    pendingSearchScrollId.value = chatStore.searchTargetMessageId;
    const target = findMessageElement(pendingSearchScrollId.value);
    if (target?.dataset?.messageRole === "user" && scrollToMessage(pendingSearchScrollId.value, "start")) {
      pendingSearchScrollId.value = null;
      chatStore.clearSearchTargetMessageId();
    }
    return;
  }

  pendingSearchScrollId.value = null;

  if (isSharedPage.value) {
    scrollToTop();
    return;
  }

  scrollToBottom();
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

async function handleMessageRendered(payload) {
  emit("content-rendered", payload);
  if (!pendingSearchScrollId.value || payload?.type !== "enhanced") return;
  await nextTick();
  scheduleSearchScroll();
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
  { immediate: true }
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
    messages.value = [];
    clearMessagesOnConversationChange();
    await loadConversation();
  },
  { immediate: true }
);

onMounted(() => {
  void appBootstrap.ensureInitialized();
});

onBeforeUnmount(() => {
  abortLoadRequest();
  clearSearchScrollTimer();
  clearMessages();
});

defineExpose({});
</script>

<style scoped lang="scss">
.message-list {
  min-width: 0;
  min-height: 0;
  overflow-anchor: none;
}

.typing-row {
  flex: 0 0 auto;
}
</style>
