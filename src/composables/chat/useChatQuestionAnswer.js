import {nextTick} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useChatStore} from "@/stores/chatStore";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {createId} from "@/utils/id";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {ROUTE_NAMES} from "@/constants/routeNames";
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


function normalizeChatId(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

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

export function appendUserAndAssistantMessages(chatId, normalized) {
  const chatStore = useChatStore();
  const currentMessages = chatStore.messageMap[chatId] || [];
  const userMessage = createUserMessage(normalized);
  const assistantMessage = createAssistantMessage();
  const nextMessages = [...currentMessages, userMessage, assistantMessage];

  chatStore.setMessages(chatId, nextMessages);
  return {messages: nextMessages, assistantMessage};
}

export function patchAssistantMessage(messages, assistantMessage, patch = {}) {
  const nextAssistantMessage = {...assistantMessage, ...patch};
  const nextMessages = messages.map((message) =>
    message.id === nextAssistantMessage.id ? nextAssistantMessage : message
  );

  return {
    messages: nextMessages,
    assistantMessage: nextAssistantMessage,
  };
}

export function appendAssistantChunk(assistantMessage, content) {
  return {
    ...assistantMessage,
    content,
    status: "streaming",
  };
}

export function markAssistantMessageError(assistantMessage, errorPatch = {}) {
  return {
    ...assistantMessage,
    status: "error",
    error: true,
    reasoningStatus: "completed",
    ...errorPatch,
  };
}

export function createAssistantMessageCommitter(
  chatId,
  initialMessages,
  initialAssistantMessage,
  setConversation
) {
  let liveMessages = initialMessages;
  let liveAssistantMessage = initialAssistantMessage;

  function commit(patch = {}) {
    const nextState = patchAssistantMessage(
      liveMessages,
      liveAssistantMessage,
      patch
    );

    liveAssistantMessage = nextState.assistantMessage;
    liveMessages = nextState.messages;
    setConversation(chatId, liveMessages);
  }

  return {
    commit,
    getAssistantMessage: () => liveAssistantMessage,
    getMessages: () => liveMessages,
  };
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

function createGenerationPayload(normalized, chatId, selectedAssistantId, selectedModel) {
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

async function scrollAfterUserSubmit(scrollLatestUserMessage, normalized = {}) {
  await nextTick();

  if (normalized.keyboardOpenOnSubmit) {
    await waitForKeyboardViewportToSettle();
    await nextTick();
  }

  await scrollLatestUserMessage({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: normalized.keyboardOpenOnSubmit === true,
    keyboardOpenOnSubmit: normalized.keyboardOpenOnSubmit === true,
  });
}

async function createConversationForSubmit(
  createRemoteConversation,
  normalized,
  chatStore
) {
  const assistantId = resolveSubmitAssistantId(chatStore);
  const modelId = resolveSubmitModelId(chatStore);

  return createRemoteConversation({
    text: normalized.text,
    assistantId,
    modelId,
  });
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

  const history = await createConversationForSubmit(
    createRemoteConversationForSubmit,
    normalized,
    chatStore
  );
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


let createRemoteConversationForSubmit = null;
let appendMessagesForSubmit = null;
let setConversationMessages = null;
let getCurrentMessagesForSubmit = null;
let scrollLatestSubmittedUserMessage = null;
let syncHistoriesForSubmit = null;
let canSubmitMessage = null;
let submitRouter = null;
let submitRoute = null;

async function submitPrompt(payload) {
  const chatStreamStore = useChatStreamStore();
  const apiRequestStore = useApiRequestStore();
  const chatStore = useChatStore();
  const route = submitRoute;
  const router = submitRouter;
  const normalized = normalizePromptPayload(payload);

  if (
    chatStore.isActiveSharedRoom ||
    !canSubmitMessage() ||
    (!normalized.text && normalized.attachments.length === 0) ||
    chatStreamStore.isWait
  ) {
    return;
  }

  chatStreamStore.startWait();

  const initialHistoryId = normalizeChatId(resolveActiveChatId());
  const isNewConversationSubmit = shouldCreateConversation(initialHistoryId, route);
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

    const {messages, assistantMessage} = appendMessagesForSubmit(
      targetHistoryId,
      normalized
    );

    const committer = createAssistantMessageCommitter(
      targetHistoryId,
      messages,
      {
        ...assistantMessage,
        ...createAssistantStreamingPatch(
          isSelectedModelReasoning(chatStore)
        ),
      },
      setConversationMessages
    );
    committer.commit();

    if (isNewConversationSubmit) {
      await syncHistoriesForSubmit();
      const entered = await enterNewSubmitChatRoom(
        router,
        chatStreamStore,
        targetHistoryId
      );
      if (!entered) {
        throw new Error("chat route navigation failed");
      }
    } else {
      syncHistoriesForSubmit();
    }

    await nextTick();
    await scrollAfterUserSubmit(scrollLatestSubmittedUserMessage, normalized);

    const selectedAssistantId = resolveSubmitAssistantId(chatStore);
    const selectedModel = resolveSubmitModelId(chatStore);

    const pendingAssistantMessage = committer.getAssistantMessage();
    chatStreamStore.setPendingGeneration({
      type: "submit",
      chatId: targetHistoryId,
      assistantMessageId: pendingAssistantMessage?.id || "",
      assistantId: selectedAssistantId,
      modelId: selectedModel,
      normalized,
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

async function regenerateResponse(message = {}) {
  const chatStreamStore = useChatStreamStore();
  const chatStore = useChatStore();

  if (
    chatStore.isActiveSharedRoom ||
    !canSubmitMessage() ||
    chatStreamStore.isWait
  ) {
    return;
  }

  const targetHistoryId = normalizeChatId(resolveActiveChatId());
  if (!targetHistoryId) return;

  const currentMessages = getCurrentMessagesForSubmit();
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
    createAssistantStreamingPatch(
      isSelectedModelReasoning(chatStore)
    )
  );
  const committer = createAssistantMessageCommitter(
    targetHistoryId,
    [...currentMessages.slice(0, assistantIndex), assistantMessage],
    assistantMessage,
    setConversationMessages
  );
  let generationHandedOff = false;

  chatStreamStore.startWait();

  committer.commit();
  await nextTick();
  await scrollLatestSubmittedUserMessage({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: false,
  });

  try {
    const selectedAssistantId = resolveSubmitAssistantId(chatStore);
    const selectedModel = resolveSubmitModelId(chatStore);

    const pendingAssistantMessage = committer.getAssistantMessage();
    chatStreamStore.setPendingGeneration({
      type: "regenerate",
      chatId: targetHistoryId,
      assistantMessageId: pendingAssistantMessage?.id || "",
      assistantId: selectedAssistantId,
      modelId: selectedModel,
      normalized,
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

export function configureChatSubmit(
  createRemoteConversation,
  appendUserAndAssistantMessages,
  setConversation,
  getCurrentMessages,
  scrollLatestUserMessage,
  syncHistories,
  canWriteCallback,
  router,
  route
) {
  createRemoteConversationForSubmit = createRemoteConversation;
  appendMessagesForSubmit = appendUserAndAssistantMessages;
  setConversationMessages = setConversation;
  getCurrentMessagesForSubmit = getCurrentMessages;
  scrollLatestSubmittedUserMessage = scrollLatestUserMessage;
  syncHistoriesForSubmit = syncHistories;
  canSubmitMessage = canWriteCallback;
  submitRouter = router;
  submitRoute = route;
}

export async function submitChatMessage(payload) {
  return submitPrompt(payload);
}

export async function regenerateLastAnswer(message) {
  return regenerateResponse(message);
}

// -----------------------------------------------------------------------------
// MessageList generation SSE
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

function createGenerationSource(payload) {
  const authOptions = resolveSseAuthOptions();

  return new SSE(resolveGenerationUrl(), {
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

export function useMessageGenerationSse({onText, onReasoning, onDone, onError} = {}) {
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
    eventSource = createGenerationSource(payload);

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
