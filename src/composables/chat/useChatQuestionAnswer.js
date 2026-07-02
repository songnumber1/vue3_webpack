import {nextTick} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useChatStore} from "@/stores/chatStore";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {createId} from "@/utils/id";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {normalizeChatId} from "@/utils/normalize";
import {
  enterNewSubmitChatRoom,
  resolveActiveChatId,
} from "@/composables/chat/chatRoomActions";
import {
  resolveGenerationUrl,
  resolveSseAuthOptions,
} from "@/api/sse/common/streamRequest";
import {SSE} from "@/api/sse/vendor/sse";
import {shouldUseFrontendMockApi} from "@/constants/apiMode";
import {adaptChatHistoryItem as adaptChatHistory} from "@/adapters/chatResponseAdapter";
import {createChatHistory, loadChatHistoryList} from "@/composables/chat/runtime/chatRuntimeApi";
import {notifyChatHistorySyncFailed} from "@/utils/chatHistoryErrorNotifier";
import {logWarn} from "@/utils/logger";


export function createUserMessage(normalized) {
  return {
    id: createId("message"),
    role: "user",
    content: normalized.text,
    attachments: normalized.attachments,
    createdAt: new Date().toISOString(),
  };
}

export function createAssistantStreamingPatch(isReasoning) {
  return {
    status: "streaming",
    isReasoning,
    reasoningContent: "",
    reasoningStatus: isReasoning ? "thinking" : "completed",
  };
}

export function createAssistantMessage(patch = {}) {
  return {
    id: createId("message"),
    role: "assistant",
    content: "",
    reasoningContent: "",
    reasoningStatus: "thinking",
    status: "streaming",
    createdAt: new Date().toISOString(),
    ...patch,
  };
}

export function revokeMessageAttachments(items = []) {
  items.forEach((message) => {
    if (!Array.isArray(message.attachments)) return;
    message.attachments.forEach((file) => {
      if (file?.url?.startsWith?.("blob:")) URL.revokeObjectURL(file.url);
    });
  });
}

export function appendUserAndAssistantMessages(chatId, normalized, assistantPatch = {}) {
  const chatStore = useChatStore();
  const currentMessages = chatStore.messageMap[chatId] || [];
  const userMessage = createUserMessage(normalized);
  const assistantMessage = createAssistantMessage(assistantPatch);

  chatStore.setMessages(chatId, [...currentMessages, userMessage, assistantMessage]);
  return {userMessage, assistantMessage};
}

// chatStreamStore.isWait를 채팅 답변 처리 중 상태의 단일 기준으로 사용합니다.


function createRequestPayload(base = {}) {
  const msgId = createId("message");
  const respMsgId = createId("message");
  return {
    [G.MESSAGE_ID]: msgId,
    [G.RESPONSE_MESSAGE_ID]: respMsgId,
    ...base,
  };
}

function resolvePromptToolSettings() {
  const promptControlStore = usePromptControlStore();
  return promptControlStore.activePromptToolSettings || {};
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

export function createGenerationPayload(normalized, chatId, selectedAssistantId, selectedModel) {
  const resolvedChatId = normalizeChatId(chatId);

  if (!resolvedChatId) {
    throw new Error("generation.do payload requires chatId from new.do or current route.");
  }

  const settings = resolvePromptToolSettings();
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

function resolveSubmitAssistantId(chatStore) {
  return chatStore.activeSession?.assistantId || chatStore.selectedAssistantId || "";
}

function resolveSubmitModelId(chatStore) {
  return chatStore.activeSession?.modelId || chatStore.selectedModelId || "";
}

function isSelectedModelReasoning(chatStore) {
  const modelId = resolveSubmitModelId(chatStore);
  return Boolean(chatStore.modelMap?.[modelId]?.isReasoning);
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

async function scrollAfterUserSubmit(normalized = {}) {
  await nextTick();

  if (normalized.keyboardOpenOnSubmit) {
    await waitForKeyboardViewportToSettle();
    await nextTick();
  }

  await scrollChatToLatestUserMessage({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: normalized.keyboardOpenOnSubmit === true,
    keyboardOpenOnSubmit: normalized.keyboardOpenOnSubmit === true,
  });
}

function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
  const model = modelMap[history?.modelId] || null;
  const assistant = assistantMap[history?.assistantId || model?.assistId] || null;
  const modelMissing = Boolean(history?.modelId && !model);
  const assistantMissing = Boolean((history?.assistantId || model?.assistId) && !assistant);
  const modelDeleted = Boolean(model?.isDeleted);
  const unavailableReason = modelDeleted
    ? "deleted"
    : modelMissing
      ? "missing-model"
      : assistantMissing
        ? "missing-assistant"
        : "";

  return {
    chatId: history?.id || "",
    assistantId: assistant?.id || history?.assistantId || model?.assistId || "",
    assistantType: assistant?.type || history?.assistantType || "",
    assistantLabel: assistant?.label || history?.assistantLabel || "",
    modelId: model?.id || history?.modelId || "",
    modelName: model?.label || history?.modelLabel || "",
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

async function syncSubmitHistories({notifyOnError = false} = {}) {
  const chatStore = useChatStore();

  try {
    const histories = await loadChatHistoryList({
      assistantMap: chatStore.assistantMap,
      modelMap: chatStore.modelMap,
    });
    chatStore.setHistories(histories);
    return histories;
  } catch (error) {
    logWarn("[useChatQuestionAnswer] sync histories failed:", error);
    if (notifyOnError) await notifyChatHistorySyncFailed(error);
    return chatStore.histories;
  }
}

async function createConversationForSubmit(normalized, chatStore) {
  const assistantId = resolveSubmitAssistantId(chatStore);
  const modelId = resolveSubmitModelId(chatStore);
  const assistant = chatStore.assistantMap?.[assistantId] || null;
  const chatId = createId();
  const rawHistory = await createChatHistory({
    chatId,
    assistId: assistantId,
    modelId,
    ChatTilte: normalized.text.slice(0, 20) || normalized.text,
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
    createSessionFromHistory(history, chatStore.modelMap, chatStore.assistantMap)
  );

  return history;
}


function shouldCreateConversation(targetHistoryId, currentRoute = {}) {
  // URL 숨김 모드에서는 기존 대화방도 /chat(chat-entry) 라우트를 사용합니다.
  // 따라서 라우트 이름만으로 새 대화 여부를 판단하면 기존 대화방 추가 질문이
  // new.do로 잘못 분기될 수 있습니다. active chat id가 있으면 항상 기존 대화방으로 처리합니다.
  if (targetHistoryId) return false;

  const routeName = currentRoute?.name;

  return routeName === ROUTE_NAMES.MAIN || routeName === ROUTE_NAMES.CHAT_ENTRY;
}

async function ensureConversationForSubmit(
  normalized,
  currentHistoryId,
  currentRoute = {},
  chatStore
) {
  let targetHistoryId = normalizeChatId(currentHistoryId);

  if (!shouldCreateConversation(targetHistoryId, currentRoute)) {
    return targetHistoryId;
  }

  const history = await createConversationForSubmit(normalized, chatStore);
  targetHistoryId = normalizeChatId(history?.id);

  if (!targetHistoryId) {
    throw new Error("new.do response does not contain chatId.");
  }

  // 새 대화는 기존 방 입장용 historyRender overlay 대상이 아닙니다.
  // 라우트 이동보다 먼저 호출부에서 사용자 질문과 assistant typing("...") 메시지를
  // store에 append해야 메인 화면 첫 질문도 기존 채팅방 질문과 동일하게 보입니다.
  chatStore.markPendingNewSubmitChat(targetHistoryId);

  return targetHistoryId;
}

function findUserMessageForRegenerate(messages, assistantIndex) {
  return [...messages]
    .slice(0, assistantIndex)
    .reverse()
    .find((item) => item.role === "user");
}


async function runChatSubmit(payload, {router, route} = {}) {
  const chatStreamStore = useChatStreamStore();
  const apiRequestStore = useApiRequestStore();
  const chatStore = useChatStore();
  const normalized = normalizePromptPayload(payload);

  if (
    chatStore.isActiveSharedRoom ||
    (!normalized.text && normalized.attachments.length === 0) ||
    chatStreamStore.isWait
  ) {
    return;
  }

  chatStreamStore.startWait();

  const initialHistoryId = normalizeChatId(resolveActiveChatId());
  const isNewConversationSubmit = shouldCreateConversation(
    initialHistoryId,
    route
  );
  let overlaySuppressed = false;
  let generationHandedOff = false;

  if (isNewConversationSubmit) {
    apiRequestStore.suppressOverlay();
    overlaySuppressed = true;
  }

  try {
    const targetHistoryId = await ensureConversationForSubmit(
      normalized,
      initialHistoryId,
      route,
      chatStore
    );

    if (isNewConversationSubmit) {
      usePromptControlStore().promoteDraftPromptToolSettingsToChat(
        targetHistoryId
      );
    }

    const {assistantMessage} = appendUserAndAssistantMessages(
      targetHistoryId,
      normalized,
      createAssistantStreamingPatch(isSelectedModelReasoning(chatStore))
    );

    if (isNewConversationSubmit) {
      await syncSubmitHistories({notifyOnError: true});
      const entered = await enterNewSubmitChatRoom(
        router,
        chatStreamStore,
        targetHistoryId
      );
      if (!entered) throw new Error("chat route navigation failed");
    } else {
      syncSubmitHistories({notifyOnError: true});
    }

    await nextTick();
    await scrollAfterUserSubmit(normalized);

    const selectedAssistantId = resolveSubmitAssistantId(chatStore);
    const selectedModel = resolveSubmitModelId(chatStore);

    startChatGeneration({
      url: resolveGenerationUrl(),
      chatId: targetHistoryId,
      assistantMessageId: assistantMessage.id,
      payload: createGenerationPayload(
        normalized,
        targetHistoryId,
        selectedAssistantId,
        selectedModel
      ),
    });
    generationHandedOff = true;
  } finally {
    if (overlaySuppressed) {
      apiRequestStore.resumeOverlay();
      overlaySuppressed = false;
    }
    if (!generationHandedOff) {
      chatStreamStore.finishWait();
    }
  }
}

async function runRegenerateAnswer(message = {}) {
  const chatStreamStore = useChatStreamStore();
  const chatStore = useChatStore();

  if (
    chatStore.isActiveSharedRoom ||
    chatStreamStore.isWait
  ) {
    return;
  }

  const targetHistoryId = normalizeChatId(resolveActiveChatId());
  if (!targetHistoryId) return;

  const currentMessages = chatStore.messageMap?.[targetHistoryId] || [];
  const assistantIndex = currentMessages.findIndex(
    (item) => item.id === message.id
  );
  if (assistantIndex <= 0) return;

  const userMessage = findUserMessageForRegenerate(
    currentMessages,
    assistantIndex
  );
  if (!userMessage) return;

  const normalized = normalizePromptPayload({
    text: userMessage.content,
    attachments: userMessage.attachments || [],
  });
  const assistantMessage = createAssistantMessage(
    createAssistantStreamingPatch(isSelectedModelReasoning(chatStore))
  );
  let generationHandedOff = false;

  chatStreamStore.startWait();
  chatStore.setMessages(targetHistoryId, [
    ...currentMessages.slice(0, assistantIndex),
    assistantMessage,
  ]);
  await nextTick();
  await scrollChatToLatestUserMessage({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: false,
  });

  try {
    const selectedAssistantId = resolveSubmitAssistantId(chatStore);
    const selectedModel = resolveSubmitModelId(chatStore);

    startChatGeneration({
      url: resolveGenerationUrl(),
      chatId: targetHistoryId,
      assistantMessageId: assistantMessage.id,
      payload: createGenerationPayload(
        normalized,
        targetHistoryId,
        selectedAssistantId,
        selectedModel
      ),
    });
    generationHandedOff = true;
  } finally {
    if (!generationHandedOff) {
      chatStreamStore.finishWait();
    }
  }
}

export async function submitChatMessage(payload, context = {}) {
  return runChatSubmit(payload, context);
}

export async function regenerateLastAnswer(message) {
  return runRegenerateAnswer(message);
}

// -----------------------------------------------------------------------------
// generation.do stream
// -----------------------------------------------------------------------------

const DONE_MESSAGE = "[DONE]";
const GENERATION_TIMEOUT_MS = 120000;

function parseJson(value) {
  if (typeof value !== "string") return value;

  const text = value.trim();
  if (!text || (text[0] !== "{" && text[0] !== "[")) return value;

  try {
    return JSON.parse(text);
  } catch (_error) {
    return value;
  }
}

function readModelId(payload = {}) {
  return payload?.[G.MODEL_ID] || payload?.[G.MODEL_ID_LEGACY] || "";
}

function isThinkingModel(modelId) {
  return String(modelId || "").toLowerCase().includes("thinking");
}

function isRagModel(modelId) {
  return String(modelId || "").toLowerCase().includes("rag");
}

function isImageModel(modelId) {
  const normalized = String(modelId || "").toLowerCase();
  return normalized.includes("image") || normalized.includes("vision");
}

function isCodeModel(modelId) {
  return String(modelId || "").toLowerCase().includes("code");
}

function isDoneData(raw) {
  const parsed = parseJson(raw);
  if (String(raw || "").trim() === DONE_MESSAGE) return true;
  return parsed && typeof parsed === "object" && parsed.done === true;
}

function unwrapData(raw) {
  const parsed = parseJson(raw);
  if (!parsed || typeof parsed !== "object") return parsed;

  const data = parseJson(parsed.data);
  return data || parsed;
}

function pickText(source, keys = []) {
  if (typeof source === "string") return source;
  if (!source || typeof source !== "object") return "";

  const delta = source.delta || {};
  for (const key of keys) {
    if (typeof source[key] === "string" && source[key]) return source[key];
    if (typeof delta[key] === "string" && delta[key]) return delta[key];
  }

  return "";
}

function readContent(raw) {
  return pickText(unwrapData(raw), ["content", "answer", "text", "message"]);
}

function readReasoning(raw) {
  return pickText(unwrapData(raw), [
    "reasoningContent",
    "reasoning_content",
    "reasoning",
  ]);
}

function createGenerationSource(payload, url = "") {
  const authOptions = resolveSseAuthOptions();

  return new SSE(url || resolveGenerationUrl(), {
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
}

function buildMockAnswer(payload = {}) {
  const question = String(payload?.[G.BODY] || "질문").trim();
  return `로컬 mock 응답입니다.\n\n질문: ${question}\n\n실제 API를 호출하지 않고 화면 렌더링과 스트리밍만 확인합니다.`;
}

function splitText(text, size) {
  const result = [];
  for (let index = 0; index < text.length; index += size) {
    result.push(text.slice(index, index + size));
  }
  return result;
}

export function createGenerationStream({url = "", onText, onReasoning, onDone, onError} = {}) {
  let eventSource = null;
  let timeoutId = null;
  let mockTimerId = null;
  let text = "";
  let reasoningText = "";

  function clearTimer() {
    if (timeoutId) window.clearTimeout(timeoutId);
    if (mockTimerId) window.clearTimeout(mockTimerId);
    timeoutId = null;
    mockTimerId = null;
  }

  function close() {
    clearTimer();
    eventSource?.close?.();
    eventSource = null;
  }

  function fail(error) {
    close();
    onError?.(error);
  }

  function complete() {
    close();
    onDone?.(text);
  }

  function handleTextModelMessage(event) {
    if (isDoneData(event?.data)) {
      complete();
      return;
    }

    const content = readContent(event?.data);
    if (!content) return;

    text += content;
    onText?.(text);
  }

  function handleThinkingModelMessage(event) {
    if (isDoneData(event?.data)) {
      complete();
      return;
    }

    const reasoning = readReasoning(event?.data);
    if (reasoning) {
      reasoningText += reasoning;
      onReasoning?.(reasoningText);
    }

    const content = readContent(event?.data);
    if (!content) return;

    text += content;
    onText?.(text);
  }

  function handleRagModelMessage(event) {
    handleTextModelMessage(event);
  }

  function handleImageModelMessage(event) {
    handleTextModelMessage(event);
  }

  function handleCodeModelMessage(event) {
    handleTextModelMessage(event);
  }

  function getModelMessageHandler(modelId) {
    if (isThinkingModel(modelId)) return handleThinkingModelMessage;
    if (isRagModel(modelId)) return handleRagModelMessage;
    if (isImageModel(modelId)) return handleImageModelMessage;
    if (isCodeModel(modelId)) return handleCodeModelMessage;
    return handleTextModelMessage;
  }

  function startMock(payload = {}, onMessage) {
    const modelId = readModelId(payload);
    const reasoningChunks = isThinkingModel(modelId)
      ? splitText("질문 의도를 확인하고 답변 구조를 정리합니다.\n", 8)
      : [];
    const answerChunks = splitText(buildMockAnswer(payload), 5);
    const chunks = [
      ...reasoningChunks.map((value) => ({reasoningContent: value})),
      ...answerChunks.map((value) => ({content: value})),
      {done: true},
    ];
    let index = 0;

    const tick = () => {
      onMessage({data: JSON.stringify(chunks[index])});
      index += 1;
      if (index >= chunks.length) return;
      mockTimerId = window.setTimeout(tick, 30);
    };

    tick();
  }

  function startLive(payload = {}, onMessage) {
    eventSource = createGenerationSource(payload, url);

    eventSource.onmessage = (event) => {
      try {
        onMessage(event);
      } catch (error) {
        fail(error);
      }
    };

    eventSource.onerror = (error) => {
      fail(error);
    };

    eventSource.stream();
  }

  function start(payload = {}) {
    close();
    text = "";
    reasoningText = "";

    const onMessage = getModelMessageHandler(readModelId(payload));

    timeoutId = window.setTimeout(() => {
      fail(new Error("generation.do timeout"));
    }, GENERATION_TIMEOUT_MS);

    if (shouldUseFrontendMockApi()) {
      startMock(payload, onMessage);
      return;
    }

    startLive(payload, onMessage);
  }

  return {start, close};
}

// -----------------------------------------------------------------------------
// question/answer view and generation runner
// -----------------------------------------------------------------------------

const CHAT_SCROLL_READY_MAX_FRAMES = 60;

const chatMessageView = {
  registered: false,
  scrollToBottom: () => false,
  scrollToBottomAfterRender: () => false,
  scrollToTop: () => false,
  scrollToMessage: () => false,
  scrollToLatestUserMessage: () => false,
  isAtBottom: () => true,
  scheduleRenderedFrameUpdate: () => {},
};

let latestUserScrollTimerIds = [];
let pendingBottomScrollRafId = 0;
let pendingBottomScrollFrameCount = 0;
let activeGeneration = null;
let activeGenerationSse = null;

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

function applyBottomScrollWhenListReady(options = {}) {
  if (!chatMessageView.registered) return false;

  if (options.afterRender) {
    chatMessageView.scrollToBottomAfterRender({
      ...options,
      force: true,
      stable: true,
    });
  } else {
    chatMessageView.scrollToBottom({...options, force: true, stable: true});
  }

  return true;
}

function scheduleBottomScrollWhenListReady(options = {}) {
  clearPendingBottomScrollScheduler();
  if (typeof window === "undefined") return;

  const check = () => {
    pendingBottomScrollRafId = 0;
    pendingBottomScrollFrameCount += 1;
    if (applyBottomScrollWhenListReady(options)) {
      pendingBottomScrollFrameCount = 0;
      return;
    }

    if (pendingBottomScrollFrameCount >= CHAT_SCROLL_READY_MAX_FRAMES) {
      pendingBottomScrollFrameCount = 0;
      return;
    }

    pendingBottomScrollRafId = window.requestAnimationFrame(check);
  };

  pendingBottomScrollRafId = window.requestAnimationFrame(check);
}

export async function scrollChatToBottom(options = {}) {
  clearPendingBottomScrollScheduler();

  if (!chatMessageView.registered) {
    if (options.force || options.stable) scheduleBottomScrollWhenListReady(options);
    return;
  }

  if (options.afterRender) {
    chatMessageView.scrollToBottomAfterRender(options);
  } else {
    chatMessageView.scrollToBottom(options);
  }
}

export async function scrollChatToInitialTarget(scrollTarget = {}, options = {}) {
  const target = scrollTarget || {type: "bottom"};
  const behavior = options.behavior || target.behavior || "auto";

  if (target.type === "message") {
    return chatMessageView.scrollToMessage(target.messageId, {
      behavior,
      block: target.block || options.block || "center",
    });
  }

  if (target.type === "first") {
    return chatMessageView.scrollToTop({behavior});
  }

  await scrollChatToBottom({force: true, behavior, ...options});
  return true;
}

export async function scrollChatToLatestUserMessage(options = {}) {
  clearLatestUserScrollTimers();

  const apply = () => {
    chatMessageView.scrollToLatestUserMessage({
      stable: true,
      ...options,
    });
    return true;
  };

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

export function isChatScrolledToBottom() {
  return chatMessageView.isAtBottom();
}

export function clearChatQuestionAnswerScrollState() {
  clearLatestUserScrollTimers();
  clearPendingBottomScrollScheduler();
}

function updateGenerationAssistantMessage(generation = {}, patch = {}) {
  const chatStore = useChatStore();
  const chatId = String(generation.chatId || "").trim();
  const assistantMessageId = String(generation.assistantMessageId || "").trim();
  if (!chatId || !assistantMessageId) return false;

  const currentMessages = chatStore.messageMap?.[chatId] || [];
  chatStore.setMessages(
    chatId,
    currentMessages.map((message) =>
      String(message?.id || "") === assistantMessageId
        ? {...message, ...patch}
        : message
    )
  );
  return true;
}

function refreshGenerationScroll() {
  chatMessageView.scrollToBottom({behavior: "auto"});
  chatMessageView.scheduleRenderedFrameUpdate({bottomState: true});
}

function finishActiveGeneration() {
  activeGeneration = null;
  activeGenerationSse = null;
  useChatStreamStore().finishWait();
}

export function stopChatGeneration() {
  activeGenerationSse?.close?.();
  activeGenerationSse = null;
}

export function startChatGeneration({url = "", payload = {}, chatId = "", assistantMessageId = ""} = {}) {
  stopChatGeneration();

  activeGeneration = {chatId, assistantMessageId};
  activeGenerationSse = createGenerationStream({
    url,
    onText(content) {
      updateGenerationAssistantMessage(activeGeneration, {
        content,
        status: "streaming",
      });
      refreshGenerationScroll();
    },
    onReasoning(reasoningContent) {
      updateGenerationAssistantMessage(activeGeneration, {
        reasoningContent,
        reasoningStatus: "thinking",
        status: "streaming",
      });
      refreshGenerationScroll();
    },
    onDone() {
      updateGenerationAssistantMessage(activeGeneration, {
        status: "complete",
        reasoningStatus: "completed",
      });
      chatMessageView.scrollToBottomAfterRender({behavior: "auto"});
      finishActiveGeneration();
    },
    onError(error) {
      updateGenerationAssistantMessage(activeGeneration, {
        status: "error",
        error: true,
        errorMessage: error?.message || "",
        reasoningStatus: "completed",
      });
      finishActiveGeneration();
    },
  });

  try {
    activeGenerationSse.start(payload);
  } catch (error) {
    updateGenerationAssistantMessage(activeGeneration, {
      status: "error",
      error: true,
      errorMessage: error?.message || "",
      reasoningStatus: "completed",
    });
    finishActiveGeneration();
  }
}

export function useChatQuestionAnswerView({
  scrollToBottom,
  scrollToBottomAfterRender,
  scrollToTop,
  scrollToMessage,
  scrollToLatestUserMessage,
  isAtBottom,
  scheduleRenderedFrameUpdate,
} = {}) {
  chatMessageView.registered = true;
  chatMessageView.scrollToBottom = scrollToBottom || (() => false);
  chatMessageView.scrollToBottomAfterRender =
    scrollToBottomAfterRender || (() => false);
  chatMessageView.scrollToTop = scrollToTop || (() => false);
  chatMessageView.scrollToMessage = scrollToMessage || (() => false);
  chatMessageView.scrollToLatestUserMessage =
    scrollToLatestUserMessage || (() => false);
  chatMessageView.isAtBottom = isAtBottom || (() => true);
  chatMessageView.scheduleRenderedFrameUpdate =
    scheduleRenderedFrameUpdate || (() => {});

  function cleanup() {
    stopChatGeneration();
    if (activeGeneration) finishActiveGeneration();
    clearChatQuestionAnswerScrollState();
    chatMessageView.registered = false;
    chatMessageView.scrollToBottom = () => false;
    chatMessageView.scrollToBottomAfterRender = () => false;
    chatMessageView.scrollToTop = () => false;
    chatMessageView.scrollToMessage = () => false;
    chatMessageView.scrollToLatestUserMessage = () => false;
    chatMessageView.isAtBottom = () => true;
    chatMessageView.scheduleRenderedFrameUpdate = () => {};
  }

  return {cleanup};
}
