import {nextTick} from "vue";
import {streamGeneration} from "@/api/sse/sse";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useChatStore} from "@/stores/chatStore";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {logWarn} from "@/utils/logger";
import {createId} from "@/utils/id";
import {shouldUseServerApi} from "@/constants/apiMode";
import {
  appendUserAndAssistantMessages,
  createAssistantMessage,
  createAssistantStreamingPatch,
} from "@/composables/chat/chatMessageActions";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {normalizeChatId} from "@/utils/normalize";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {adaptChatHistoryItem as adaptChatHistory} from "@/adapters/chatResponseAdapter";
import {
  createChatHistory,
  loadChatHistoryList,
} from "@/composables/chat/runtime/chatRuntimeApi";
import {
  createLocalHistory,
  createSessionFromHistory,
} from "@/composables/chat/runtime/chatSessionFactory";
import {
  enterNewSubmitChatRoom,
  resolveActiveChatId,
} from "@/composables/chat/chatRoomActions";
// chatStreamStore.isWait를 채팅 답변 처리 중 상태의 단일 기준으로 사용합니다.

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitAnimationFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

let chatQuestionAnswerView = {};

export function registerChatQuestionAnswerView(view = {}) {
  chatQuestionAnswerView = view;
  return () => {
    if (chatQuestionAnswerView === view) {
      chatQuestionAnswerView = {};
    }
  };
}

export function isChatScrolledToBottom() {
  return chatQuestionAnswerView.isAtBottom?.() === true;
}

export function scrollChatToBottom(options = {}) {
  const view = chatQuestionAnswerView;
  if (options.afterRender && view.scrollToBottomAfterRender) {
    view.scrollToBottomAfterRender(options);
    return;
  }
  view.scrollToBottom?.(options);
}

export function scrollChatToInitialTarget(scrollTarget = {}, options = {}) {
  if (chatQuestionAnswerView.scrollToInitialTarget) {
    chatQuestionAnswerView.scrollToInitialTarget(scrollTarget, options);
    return true;
  }
  if (scrollTarget?.type === "bottom") {
    scrollChatToBottom(options);
    return true;
  }
  return false;
}

async function renderAfterAssistantStream() {
  await nextTick();
  await waitAnimationFrame();
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

function resolveSubmitAssistantId(assistantStore, chatStore) {
  return (
    chatStore.activeSession?.assistantId || assistantStore.selectedAssistantId || ""
  );
}

function resolveSubmitModelId(assistantStore, chatStore) {
  return chatStore.activeSession?.modelId || assistantStore.selectedModelId || "";
}

function isSelectedModelReasoning(assistantStore, chatStore) {
  const modelId = resolveSubmitModelId(assistantStore, chatStore);
  return Boolean(assistantStore.modelMap?.[modelId]?.isReasoning);
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



function createRequestPayload(base = {}) {
  return {
    [G.MESSAGE_ID]: createId("message"),
    [G.RESPONSE_MESSAGE_ID]: createId("message"),
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

export function createGenerationPayload(
  normalized,
  chatId,
  selectedAssistantId,
  selectedModel
) {
  const resolvedChatId = normalizeChatId(chatId);
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

async function commitFirstAnswerChunk(content, getAssistantMessage, commit) {
  if (getAssistantMessage().reasoningStatus === "thinking") {
    commit({reasoningStatus: "completed", content});
    await nextTick();
    return;
  }

  commit({content});
}

export async function startChatGeneration({
  normalized,
  chatId,
  assistantId,
  modelId,
  updateAssistant,
  getAssistant,
}) {
  try {
    const generationPayload = createGenerationPayload(
      normalized,
      chatId,
      assistantId,
      modelId
    );

    await streamGeneration(generationPayload, {
      onChunk: async (content) => {
        await commitFirstAnswerChunk(content, getAssistant, updateAssistant);
      },
      onComplete: () => {
        updateAssistant({status: "complete", reasoningStatus: "completed"});
      },
    });

    updateAssistant({status: "complete", reasoningStatus: "completed"});
    await renderAfterAssistantStream();
  } catch (error) {
    logWarn("[chatSubmitActions] 스트리밍 오류:", error);
    updateAssistant({
      status: "error",
      error: true,
      errorTitle: "답변 생성 실패",
      errorMessage: "응답 생성 중 오류가 발생했습니다.",
      errorCode: "SSE_STREAM_ERROR",
      reasoningStatus: "completed",
    });
  }
}



async function scrollAfterUserSubmit(normalized = {}) {
  await nextTick();

  if (normalized.keyboardOpenOnSubmit) {
    await waitForKeyboardViewportToSettle();
    await nextTick();
  }

  chatQuestionAnswerView.scrollToLatestUserMessage?.({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    keyboardOpenOnSubmit: normalized.keyboardOpenOnSubmit === true,
  });
}

async function createConversationForSubmit(normalized, assistantStore, chatStore) {
  const assistantId = resolveSubmitAssistantId(assistantStore, chatStore);
  const modelId = resolveSubmitModelId(assistantStore, chatStore);

  if (!shouldUseServerApi()) {
    const history = createLocalHistory(
      normalized.text,
      assistantStore.currentAssistant,
      assistantStore.currentModel || assistantStore.currentModels[0]
    );
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

  const chatId = createId();
  const chatTitle = normalized.text.slice(0, 20);
  const assistant = assistantStore.assistantMap?.[assistantId] || null;
  const rawHistory = await createChatHistory({
    chatId,
    assistId: assistantId,
    modelId,
    ChatTilte: chatTitle || normalized.text,
    studio: assistant?.type === "studio",
  });
  const history = adaptChatHistory(rawHistory, {
    assistantMap: assistantStore.assistantMap,
    modelMap: assistantStore.modelMap,
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
  assistantStore,
  chatStore
) {
  let targetHistoryId = normalizeChatId(currentHistoryId);

  if (!shouldCreateConversation(targetHistoryId, currentRoute)) {
    return targetHistoryId;
  }

  const history = await createConversationForSubmit(
    normalized,
    assistantStore,
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

function createRegenerateAssistantMessage(assistantStore, chatStore) {
  return createAssistantMessage(
    createAssistantStreamingPatch(
      isSelectedModelReasoning(assistantStore, chatStore)
    )
  );
}

function createAssistantUpdater(chatId, initialMessages, initialAssistantMessage) {
  const chatStore = useChatStore();
  let messages = initialMessages;
  let assistantMessage = initialAssistantMessage;

  function updateAssistant(patch = {}) {
    assistantMessage = {...assistantMessage, ...patch};
    messages = messages.map((message) =>
      message.id === assistantMessage.id ? assistantMessage : message
    );
    chatStore.setMessages(chatId, messages);
  }

  return {
    updateAssistant,
    getAssistant: () => assistantMessage,
  };
}

function findUserMessageForRegenerate(messages, assistantIndex) {
  return [...messages]
    .slice(0, assistantIndex)
    .reverse()
    .find((item) => item.role === "user");
}

function canSubmitChatMessage() {
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();
  return !chatStore.isActiveSharedRoom && !assistantStore.isActiveModelUnavailable;
}

async function syncSubmitHistories() {
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();
  const histories = await loadChatHistoryList({
    assistantMap: assistantStore.assistantMap,
    modelMap: assistantStore.modelMap,
  });
  chatStore.setHistories(histories);
}


async function submitPrompt(payload, context = {}) {
  const chatStreamStore = useChatStreamStore();
  const apiRequestStore = useApiRequestStore();
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();
  const route = context.route?.value || context.route || {};
  const router = context.router;
  const normalized = normalizePromptPayload(payload);

  if (
    chatStore.isActiveSharedRoom ||
    !canSubmitChatMessage() ||
    (!normalized.text && normalized.attachments.length === 0) ||
    chatStreamStore.isWait
  ) {
    return;
  }

  chatStreamStore.startWait();

  const initialHistoryId = normalizeChatId(resolveActiveChatId());
  const isNewConversationSubmit = shouldCreateConversation(initialHistoryId, route);
  let overlaySuppressed = false;

  if (isNewConversationSubmit) {
    apiRequestStore.suppressOverlay();
    overlaySuppressed = true;
  }

  try {
    const targetHistoryId = await ensureConversationForSubmit(
      normalized,
      initialHistoryId,
      route,
      assistantStore,
      chatStore
    );

    if (isNewConversationSubmit) {
      usePromptControlStore().promoteDraftPromptToolSettingsToChat(
        targetHistoryId
      );
    }

    const appended = appendUserAndAssistantMessages(targetHistoryId, normalized);
    const assistantMessage = {
      ...appended.assistantMessage,
      ...createAssistantStreamingPatch(
        isSelectedModelReasoning(assistantStore, chatStore)
      ),
    };
    const messages = appended.messages.map((item) =>
      item.id === assistantMessage.id ? assistantMessage : item
    );
    chatStore.setMessages(targetHistoryId, messages);
    const generationTarget = createAssistantUpdater(
      targetHistoryId,
      messages,
      assistantMessage
    );

    if (isNewConversationSubmit) {
      await syncSubmitHistories();
      await enterNewSubmitChatRoom(router, chatStreamStore, targetHistoryId);
    } else {
      syncSubmitHistories();
    }

    await nextTick();
    await scrollAfterUserSubmit(normalized);

    const selectedAssistantId = resolveSubmitAssistantId(assistantStore, chatStore);
    const selectedModel = resolveSubmitModelId(assistantStore, chatStore);

    await startChatGeneration({
      normalized,
      chatId: targetHistoryId,
      assistantId: selectedAssistantId,
      modelId: selectedModel,
      updateAssistant: generationTarget.updateAssistant,
      getAssistant: generationTarget.getAssistant,
    });
  } finally {
    if (overlaySuppressed) {
      apiRequestStore.resumeOverlay();
      overlaySuppressed = false;
    }
    chatStreamStore.finishWait();
  }
}

async function regenerateResponse(message = {}) {
  const chatStreamStore = useChatStreamStore();
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();

  if (
    chatStore.isActiveSharedRoom ||
    !canSubmitChatMessage() ||
    chatStreamStore.isWait
  ) {
    return;
  }

  const targetHistoryId = normalizeChatId(resolveActiveChatId());
  if (!targetHistoryId) return;

  const currentMessages = chatStore.messageMap[targetHistoryId] || [];
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
  const assistantMessage = createRegenerateAssistantMessage(
    assistantStore,
    chatStore
  );
  const messages = [...currentMessages.slice(0, assistantIndex), assistantMessage];
  chatStore.setMessages(targetHistoryId, messages);
  const generationTarget = createAssistantUpdater(
    targetHistoryId,
    messages,
    assistantMessage
  );
  chatStreamStore.startWait();
  await nextTick();
  chatQuestionAnswerView.scrollToLatestUserMessage?.({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
  });

  try {
    const selectedAssistantId = resolveSubmitAssistantId(assistantStore, chatStore);
    const selectedModel = resolveSubmitModelId(assistantStore, chatStore);

    await startChatGeneration({
      normalized,
      chatId: targetHistoryId,
      assistantId: selectedAssistantId,
      modelId: selectedModel,
      updateAssistant: generationTarget.updateAssistant,
      getAssistant: generationTarget.getAssistant,
    });
  } finally {
    chatStreamStore.finishWait();
  }
}

export async function submitChatMessage(payload, context = {}) {
  return submitPrompt(payload, context);
}

export async function regenerateLastAnswer(message) {
  return regenerateResponse(message);
}
