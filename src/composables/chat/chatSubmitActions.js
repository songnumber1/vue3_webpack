import {nextTick} from "vue";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useChatStore} from "@/stores/chatStore";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {logWarn} from "@/utils/logger";
import {createId} from "@/utils/id";
import {shouldUseServerApi} from "@/constants/apiMode";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {
  createAssistantMessage,
  createAssistantMessageCommitter,
  createAssistantStreamingPatch,
} from "@/composables/chat/chatMessageActions";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {normalizeChatId} from "@/utils/normalize";
import {
  enterNewSubmitChatRoom,
  resolveActiveChatId,
} from "@/composables/chat/chatRoomActions";
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

function canWrite(canWriteCallback) {
  return typeof canWriteCallback === "function" ? canWriteCallback() : true;
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


async function scrollAfterUserSubmit(scrollLatestUserMessage, normalized = {}) {
  await nextTick();

  if (normalized.keyboardOpenOnSubmit) {
    await waitForKeyboardViewportToSettle();
    await nextTick();
  }

  await scrollLatestUserMessage?.({
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
  createLocalConversation,
  normalized,
  assistantStore,
  chatStore
) {
  const assistantId = resolveSubmitAssistantId(assistantStore, chatStore);
  const modelId = resolveSubmitModelId(assistantStore, chatStore);

  try {
    return await createRemoteConversation({
      text: normalized.text,
      assistantId,
      modelId,
    });
  } catch (error) {
    if (shouldUseServerApi()) {
      logWarn("[chatSubmitActions] new.do 호출 실패:", error);
      throw error;
    }

    logWarn(
      "[chatSubmitActions] new.do 호출 실패, local conversation으로 대체:",
      error
    );
    return createLocalConversation(normalized);
  }
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
    createRemoteConversationForSubmit,
    createLocalConversationForSubmit,
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

function createSubmitCommitter(
  setConversation,
  assistantStore,
  chatStore,
  targetHistoryId,
  messages,
  assistantMessage
) {
  return createAssistantMessageCommitter(
    targetHistoryId,
    messages,
    {
      ...assistantMessage,
      ...createAssistantStreamingPatch(
        isSelectedModelReasoning(assistantStore, chatStore)
      ),
    },
    setConversation
  );
}

function createRegenerateAssistantMessage(assistantStore, chatStore) {
  return createAssistantMessage(
    createAssistantStreamingPatch(
      isSelectedModelReasoning(assistantStore, chatStore)
    )
  );
}

function findUserMessageForRegenerate(messages, assistantIndex) {
  return [...messages]
    .slice(0, assistantIndex)
    .reverse()
    .find((item) => item.role === "user");
}

function setPendingGeneration({
  chatStreamStore,
  normalized,
  chatId,
  assistantId,
  modelId,
  assistantMessage,
  type,
}) {
  chatStreamStore.setPendingGeneration({
    type,
    chatId,
    assistantMessageId: assistantMessage?.id || "",
    assistantId,
    modelId,
    normalized,
    payload: createGenerationPayload(normalized, chatId, assistantId, modelId),
  });
}


let createRemoteConversationForSubmit = null;
let createLocalConversationForSubmit = null;
let appendMessagesForSubmit = null;
let setConversationMessages = null;
let getCurrentMessagesForSubmit = null;
let scrollLatestSubmittedUserMessage = null;
let syncHistoriesForSubmit = null;
let canSubmitMessage = null;
let submitRouter = null;
let submitRoute = null;

function hasChatSubmitRuntime() {
  return (
    typeof createRemoteConversationForSubmit === "function" &&
    typeof createLocalConversationForSubmit === "function" &&
    typeof appendMessagesForSubmit === "function" &&
    typeof setConversationMessages === "function"
  );
}

async function submitPrompt(payload) {
  if (!hasChatSubmitRuntime()) return;

  const chatStreamStore = useChatStreamStore();
  const apiRequestStore = useApiRequestStore();
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();
  const route = submitRoute?.value || submitRoute || {};
  const router = submitRouter;
  const normalized = normalizePromptPayload(payload);

  if (
    chatStore.isActiveSharedRoom ||
    !canWrite(canSubmitMessage) ||
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
      assistantStore,
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

    const committer = createSubmitCommitter(
      setConversationMessages,
      assistantStore,
      chatStore,
      targetHistoryId,
      messages,
      assistantMessage
    );
    committer.commit();

    if (isNewConversationSubmit) {
      await syncHistoriesForSubmit?.();
      await enterNewSubmitChatRoom(router, chatStreamStore, targetHistoryId);
    } else {
      syncHistoriesForSubmit?.();
    }

    await nextTick();
    await scrollAfterUserSubmit(scrollLatestSubmittedUserMessage, normalized);

    const selectedAssistantId = resolveSubmitAssistantId(assistantStore, chatStore);
    const selectedModel = resolveSubmitModelId(assistantStore, chatStore);

    setPendingGeneration({
      chatStreamStore,
      normalized,
      chatId: targetHistoryId,
      assistantId: selectedAssistantId,
      modelId: selectedModel,
      assistantMessage: committer.getAssistantMessage(),
      type: "submit",
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
  if (!hasChatSubmitRuntime()) return;

  const chatStreamStore = useChatStreamStore();
  const chatStore = useChatStore();
  const assistantStore = useAssistantStore();

  if (
    chatStore.isActiveSharedRoom ||
    !canWrite(canSubmitMessage) ||
    chatStreamStore.isWait
  ) {
    return;
  }

  const targetHistoryId = normalizeChatId(resolveActiveChatId());
  if (!targetHistoryId) return;

  const currentMessages = getCurrentMessagesForSubmit?.() || [];
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
  await scrollLatestSubmittedUserMessage?.({
    behavior: "auto",
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: false,
  });

  try {
    const selectedAssistantId = resolveSubmitAssistantId(assistantStore, chatStore);
    const selectedModel = resolveSubmitModelId(assistantStore, chatStore);

    setPendingGeneration({
      chatStreamStore,
      normalized,
      chatId: targetHistoryId,
      assistantId: selectedAssistantId,
      modelId: selectedModel,
      assistantMessage: committer.getAssistantMessage(),
      type: "regenerate",
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
  createLocalConversation,
  appendUserAndAssistantMessages,
  setConversation,
  getCurrentMessages,
  scrollLatestUserMessage,
  syncHistories,
  renderAfterStream,
  canWriteCallback,
  router,
  route
) {
  createRemoteConversationForSubmit = createRemoteConversation;
  createLocalConversationForSubmit = createLocalConversation;
  appendMessagesForSubmit = appendUserAndAssistantMessages;
  setConversationMessages = setConversation;
  getCurrentMessagesForSubmit = getCurrentMessages;
  scrollLatestSubmittedUserMessage = scrollLatestUserMessage;
  syncHistoriesForSubmit = syncHistories;
  void renderAfterStream;
  canSubmitMessage = canWriteCallback;
  submitRouter = router || null;
  submitRoute = route || null;
}

export async function submitChatMessage(payload) {
  return submitPrompt(payload);
}

export async function regenerateLastAnswer(message) {
  return regenerateResponse(message);
}
