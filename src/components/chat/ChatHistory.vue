<template>
  <div v-show="props.visible" class="message-list-shell">
    <section
      ref="scrollRef"
      class="message-list"
      :class="{'message-list--hidden': !messageListReady}"
      aria-live="polite"
      :aria-busy="isWait || !messageListReady ? 'true' : 'false'"
      @scroll.passive="handleScroll"
    >
      <template v-for="(chatCompletion, index) in chatCompletions" :key="chatCompletion.id">
        <ChatUser
          v-if="chatCompletion.role === 'user'"
          :data-message-id="chatCompletion.id"
          :require-info="{
            chatCompletion,
            chatIdx: index,
            lastChatIdx,
            chatOwnerName,
            messageFileHist,
            chatImageList,
            regFileList,
            imageToggleInfo,
          }"
          @rendered="handleMessageRendered"
        />
        <AssistantErrorMessage
          v-else-if="isAssistantErrorMessage(chatCompletion)"
          :data-message-id="chatCompletion.id"
          :message="chatCompletion"
          @rendered="handleMessageRendered"
        />
        <template v-else>
          <ChatResponse
            :data-message-id="chatCompletion.id"
            :message="chatCompletion"
            :content="chatCompletion.content"
            :reason-content="chatCompletion.reasoningContent"
            :is-generation="isGeneration"
            :resp-msg-id="respMsgId"
            :interaction-blocked="shouldBlockAssistantInteraction(chatCompletion)"
            :show-regenerate="!isReadOnlyChat && isLastChatResponse(chatCompletion)"
            @rendered="handleMessageRendered"
            @regenerate="reGeneration"
          />
          <div
            v-if="getMessageTailSpacerHeight(chatCompletion)"
            class="message-tail-spacer"
            :style="{height: `${getMessageTailSpacerHeight(chatCompletion)}px`}"
            aria-hidden="true"
          ></div>
        </template>
      </template>

      <div v-if="isWait" class="typing-row">
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
import {resolveChatApis} from "@/api/runtime/chatApis";
import {adaptMessageList} from "@/adapters/messageResponseAdapter";
import {adaptChatHistoryList} from "@/adapters/chatResponseAdapter";
import {logWarn} from "@/utils/logger";
import {createId} from "@/utils/id";
import {adaptChatHistoryItem as adaptChatHistory} from "@/adapters/chatResponseAdapter";
import {
  DEFAULT_API_BASE_PATH,
  SERVER_API_BASE_URL,
  shouldUseServerApi,
} from "@/constants/apiMode";
import {SSE} from "@/api/sse/vendor/sse";
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
const isReadOnlyChat = computed(
  () =>
    isSharedPage.value ||
    chatStore.isActiveSharedRoom ||
    isSharedChat(activeHistory.value)
);
const chatCompletions = ref([]);
const isWait = computed(() => chatStore.isWait);
const scrollRef = ref(null);
const messageListReady = ref(true);
const chatOwnerName = ref(null);
const messageFileHist = ref([]);
const chatImageList = ref([]);
const regFileList = ref([]);
const isMsgPopup = ref(false);
const isGeneration = ref(false);
const isHndleScroll = ref(false);
const isChangeChatId = ref(true);
const respondingInfo = ref({curIdx: 0, endIdx: 0});
const imageToggleInfo = ref({});
const respMsgId = ref(null);

const selectedChatId = computed(() => chatStore.selectedChatId);
const selectedChatInfo = computed(() => activeHistory.value);
const selectedAssist = computed(() => getSubmitAssistantId());
const selectedModel = computed(() => getSubmitModelId());
const selectedAssistInfo = computed(() => chatStore.activeSession || null);
const selectedModelInfo = computed(() => chatStore.modelMap[getSubmitModelId()] || null);
const inputChat = computed(() => chatStore.input);
const isEmptyChat = computed(() => chatCompletions.value.length === 0);
const lastChatIdx = computed(() => chatCompletions.value.length - 1);
const lastChatInfo = computed(() =>
  chatCompletions.value.length > 0
    ? chatCompletions.value[chatCompletions.value.length - 1]
    : null
);
const lastUserChatInfo = computed(() => {
  for (let index = chatCompletions.value.length - 1; index >= 0; index -= 1) {
    if (chatCompletions.value[index]?.role === "user") return chatCompletions.value[index];
  }
  return null;
});

const DONE_STREAM_MESSAGE = "[DONE]";
const GENERATION_STREAM_TIMEOUT_MS = 120000;
const HISTORY_RENDER_WAIT_TIMEOUT_MS = 1500;
let loadController = null;
let generateChatId = null;
let currentRouteMode = null;
let currentHistoryId = null;
let historyRenderWait = null;
let historyRenderToken = 0;
let eventSource = null;
let completionTimer = null;
let generationResolve = null;
let generationReject = null;

function isSharedChat(chat) {
  return String(chat?.sharedId || "").trim().length > 0;
}

function revokeMessageAttachments(items = []) {
  items.forEach((chatCompletion) => {
    if (!Array.isArray(chatCompletion.attachments)) return;
    chatCompletion.attachments.forEach((file) => {
      if (file?.url?.startsWith?.("blob:")) URL.revokeObjectURL(file.url);
    });
  });
}

function createAssistantStreamingPatch(isReasoning) {
  return {
    status: "streaming",
    isReasoning,
    reasoningContent: "",
    reasoningStatus: isReasoning ? "thinking" : "completed",
  };
}

function createChatUser(userPrompt = {}) {
  return {
    id: createId("message"),
    role: "user",
    content: userPrompt.text,
    attachments: userPrompt.attachments,
    createdAt: new Date().toISOString(),
  };
}

function createChatResponse(patch = {}) {
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

async function createChatHistory(payload = {}) {
  const {chatHistoryApi} = resolveChatApis();
  return chatHistoryApi.createChat(payload);
}

async function loadChatHistoryList(context = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawHistories = await chatHistoryApi.getChatHistoryList();
  return adaptChatHistoryList(rawHistories, context);
}

async function loadChatMessageRouters(payload = {}, options = {}) {
  const {chatHistoryApi} = resolveChatApis();
  const rawMessages = await chatHistoryApi.getChatHistoryDetail(
    payload,
    options
  );
  return adaptMessageList(rawMessages);
}

async function loadGenerationErrorMessages(payload = {}, cause = {}) {
  const {generationErrorApi} = resolveChatApis();
  if (typeof generationErrorApi?.createGenerationErrorMessages !== "function") {
    return [];
  }
  const rawMessages = await generationErrorApi.createGenerationErrorMessages(
    payload,
    cause
  );
  return adaptMessageList(rawMessages);
}

function createLocalHistory(text, assistant, model) {
  const chatId = createId();
  return {
    chatId,
    temporary: true,
    syncStatus: "local",
    title: text || "New chat",
    preview: text || "New conversation from attachments",
    modelId: model?.id || "",
    assistantId: assistant?.id || model?.assistId || "",
    assistantType: assistant?.type || "",
    assistantLabel: assistant?.label || "",
    modelLabel: model?.label || "",
    isPinned: false,
    endedAt: new Date().toISOString(),
    userId: "",
    raw: null,
  };
}

function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
  if (!history) return null;

  const model = modelMap[history.modelId] || null;
  const assistant = assistantMap[history.assistantId || model?.assistId] || null;
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
    chatId: history.chatId,
    sharedId: history.sharedId || null,
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

function resolveConversationSessionState(history = {}, session = null) {
  if (!session) return {session: null, nextSelectedAssistantId: ""};

  const nextSession = {...session};
  const assistant = chatStore.assistantMap?.[nextSession.assistantId] || null;
  const isStudioSession = Boolean(
    nextSession.assistantType === "studio" ||
      history?.assistantType === "studio" ||
      assistant?.type === "studio" ||
      assistant?.isStudio === true ||
      assistant?.studio === true
  );
  const isDeletedStudio = Boolean(
    isStudioSession &&
      nextSession.assistantId &&
      studioRuntimeStore?.isStudioDeleted?.(nextSession.assistantId)
  );

  if (isDeletedStudio) {
    nextSession.displayAssistantId = nextSession.assistantId;
    nextSession.displayAssistantLabel =
      nextSession.assistantLabel || history.assistantLabel || "";
    nextSession.isAssistantMissing = true;
    nextSession.isModelUnavailable = true;
    nextSession.modelUnavailableReason = "missing-assistant";
  }

  const firstAssistant = chatStore.assistants?.[0] || null;
  const displayAssistant =
    nextSession.isModelDeleted ||
    nextSession.isModelMissing ||
    nextSession.isAssistantMissing ||
    !nextSession.assistantId
      ? firstAssistant
      : chatStore.assistantMap?.[nextSession.assistantId] || firstAssistant;

  if (!nextSession.displayAssistantLabel && displayAssistant?.id) {
    nextSession.displayAssistantId = displayAssistant.id;
    nextSession.displayAssistantLabel = displayAssistant.label;
  }

  return {
    session: nextSession,
    displayAssistant,
    nextSelectedAssistantId:
      !isDeletedStudio && displayAssistant?.id ? displayAssistant.id : "",
  };
}

async function getSharedConversation(shareId, options = {}) {
  const shareIdText = String(shareId || "").trim();
  const {chatHistoryApi} = resolveChatApis();
  const response = await chatHistoryApi.getSharedConversation(
    {shareId: shareIdText},
    options
  );
  const messages = Array.isArray(response?.messages) ? response.messages : [];
  const exists =
    response?.exists === true ||
    response?.success === true ||
    (response?.exists !== false && response?.success !== false && messages.length > 0);

  return {
    ...response,
    exists,
    success: exists,
    shareId: String(response?.shareId || shareIdText).trim(),
    messages,
    chatCompletions: adaptMessageList(messages),
  };
}

async function enterNewSubmitChatRoom(router, chatId) {
  const id = String(chatId || "").trim();
  if (!id) return false;

  chatStore.setActiveChatRoom(id);
  chatStore.clearSearchTargetMessageId();
  chatStore.clearInitialScrollRequest();

  try {
    if (router?.currentRoute?.value?.name !== ROUTE_NAMES.CHAT_ENTRY) {
      await router?.push?.({name: ROUTE_NAMES.CHAT_ENTRY});
    }
    return true;
  } catch (_error) {
    if (String(chatStore.selectedChatId || "") === id) {
      chatStore.clearActiveSession();
    }
    return false;
  }
}

function setChatCompletions(nextChatCompletions = []) {
  chatCompletions.value = nextChatCompletions;
}

function clearChatCompletions() {
  revokeMessageAttachments(chatCompletions.value);
  setChatCompletions([]);
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
  clearChatCompletions();
}

function resetHistoryRenderWait() {
  if (historyRenderWait) {
    window.clearTimeout(historyRenderWait.timeoutId);
    historyRenderWait.resolve?.();
    historyRenderWait = null;
  }
  historyRenderToken += 1;
}

function hasImageAttachment(message) {
  return (
    Array.isArray(message?.attachments) &&
    message.attachments.some((file) => file?.kind === "image")
  );
}

function createHistoryRenderWait(nextChatCompletions = []) {
  resetHistoryRenderWait();

  const expected = nextChatCompletions
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
}

async function renderLoadedMessages(nextChatCompletions = [], signal) {
  startHistoryRenderPresentation();
  const renderWait = createHistoryRenderWait(nextChatCompletions);
  setChatCompletions(nextChatCompletions);

  await nextTick();
  await renderWait.promise;
  await nextTick();

  if (signal?.aborted) return;

  scrollToChatId();
  finishHistoryRenderPresentation();
  await nextTick();
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

async function getRoomInfo() {
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
  await getRoomInfo();
  return findHistory(chatId);
}

async function getResponse(history, signal) {
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

async function getChatHistory(respondingCheck = false, signal) {
  if (
    chatStore.isWait &&
    generateChatId &&
    activeHistoryId.value === generateChatId
  )
    return;

  if (isMainPage.value) {
    clearChatCompletions();
    chatStore.clearActiveSession();
    return;
  }

  if (!activeHistoryId.value) {
    clearChatCompletions();
    return;
  }

  const history = await findHistoryForLoad(activeHistoryId.value);
  if (!history) {
    clearChatCompletions();
    chatStore.clearActiveSession();
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
    return;
  }

  chatStore.setActiveChatRoom(history.chatId);
  const nextChatCompletions = await getResponse(history, signal);
  if (signal?.aborted) return;

  callbackTrnFunc(
    {
      tranId: respondingCheck ? "getIsResponding" : "getChatHistory",
      result: {res: nextChatCompletions, param: null},
    },
    true
  );

  await renderLoadedMessages(chatCompletions.value, signal);
}

async function getSharedChatHistory(signal) {
  const sharedId = getSharedEntryId() || activeHistoryId.value;
  if (!sharedId) {
    clearChatCompletions();
    return;
  }

  const result = await getSharedConversation(sharedId, {signal});
  if (!result.exists) {
    clearChatCompletions();
    chatStore.clearActiveRoom();
    await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {});
    return;
  }

  chatStore.setActiveSharedRoom(result.shareId || sharedId);
  if (route.name === ROUTE_NAMES.SHARED_ENTRY) {
    await router.replace({name: ROUTE_NAMES.SHARED}).catch(() => {});
  }

  await renderLoadedMessages(result.chatCompletions, signal);
}

function getChatOwnerName() {
  chatOwnerName.value = selectedChatInfo.value?.ownerName || selectedChatInfo.value?.userName || null;
}

function getMessageFileHist() {
  messageFileHist.value = chatCompletions.value.filter((chatCompletion) =>
    Array.isArray(chatCompletion?.attachments) &&
    chatCompletion.attachments.some((file) => file?.kind !== "image")
  );
}

function getChatImageList() {
  chatImageList.value = chatCompletions.value.filter((chatCompletion) =>
    Array.isArray(chatCompletion?.attachments) &&
    chatCompletion.attachments.some((file) => file?.kind === "image")
  );
}

function getChatStudioInfo() {
  return selectedAssistInfo.value;
}

function getLastChatInfo() {
  return lastChatInfo.value;
}

function getAssocInfo() {
  getChatOwnerName();
  getMessageFileHist();
  getChatImageList();
  getChatStudioInfo();
  getLastChatInfo();
}

async function getChatHistInfo() {
  if (!isConversationPage.value && !isMainPage.value) return;

  const shouldLock =
    isConversationPage.value && !chatStore.isWait && !chatStore.input;
  if (shouldLock) chatStore.startWait();

  const signal = createLoadSignal();

  try {
    getAssocInfo();

    if (isSharedPage.value) {
      await getSharedChatHistory(signal);
      return;
    }
    await getChatHistory(false, signal);
  } catch (error) {
    if (!isAbortError(error))
      logWarn("[ChatHistory] getChatHistInfo 오류:", error);
  } finally {
    loadController = null;
    if (shouldLock) chatStore.finishWait();
  }
}

function callbackTrnFunc(callbackRes, isSuccess = true) {
  const tranId = callbackRes?.tranId;
  const result = callbackRes?.result || {};
  const res = result.res;

  if (!isSuccess) {
    chatStore.finishWait();
    return;
  }

  if (
    tranId === "getResponse" ||
    tranId === "getChatHistory" ||
    tranId === "getIsResponding" ||
    tranId === "createErrorChat"
  ) {
    if (Array.isArray(res)) setChatCompletions(res);
    getAssocInfo();
    return;
  }

  if (tranId === "getChatOwnerName") {
    chatOwnerName.value = res;
    return;
  }

  if (tranId === "getMessageFileHist") {
    messageFileHist.value = Array.isArray(res) ? res : [];
    return;
  }

  if (tranId === "getChatImageList") {
    chatImageList.value = Array.isArray(res) ? res : [];
    return;
  }

  if (tranId === "getRoomInfo" && Array.isArray(res)) {
    chatStore.setHistories(res);
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

function getChatInfo(promptPayload, chatId) {
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

function evtSrcReadyStateChange(event) {
  if (event.readyState !== 2) return;
  completeAnswer();
}

function createTimer() {
  window.clearTimeout(completionTimer);
  completionTimer = window.setTimeout(() => {
    createErrorChat("서비스 응답이 지연되어 잠시 후 다시 시도해주세요.");
  }, GENERATION_STREAM_TIMEOUT_MS);
}

function validateBefOnMessaging(data) {
  const validFlag = "[__VALID__]";

  if (typeof data === "string" && data.indexOf(validFlag) === 0) {
    window.alert(data.replace(validFlag, "").split("__")[0]);
    return false;
  }

  if (!chatStore.isWait) {
    window.clearTimeout(completionTimer);
    eventSource?.close?.();
    return false;
  }

  return true;
}

function addRespCompleted(isStartResponse, responseInfo = {}) {
  if (!isStartResponse) return false;

  const response = createChatResponse({
    id: responseInfo.id || respMsgId.value || createId("message"),
    role: responseInfo.role || "assistant",
    content: responseInfo.content || "",
    reasoningContent: responseInfo.reasoningContent || "",
    status: "streaming",
    intention: responseInfo.intention,
    isRAG: responseInfo.isRAG,
  });

  response.feedback = 0;
  setChatCompletions([
    ...chatCompletions.value.slice(0, chatCompletions.value.length - 1),
    response,
  ]);
  createTimer();
  return true;
}

function getOnMessageFunc() {
  const modelInfo = selectedModelInfo.value || {};
  const modelType = modelInfo.modelType || modelInfo.type || modelInfo.id;

  switch (modelType) {
    case "Orch_V2":
    case "Orch_V2_SSKS":
    case "Orch_V2_Studio":
      return getAzurAnswer;

    case "HCX_SkillSet":
      return getSkillSetAnswer;

    case "Orch_V2_Reasoning":
    case "Orch_V2_SSKS_Reasoning":
    case "Orch_V2_Studio_Reasoning":
    case "Orch_V2_Studio_Secure":
    case "DeepResearch":
      return getReasoningModelAnswer;
  }

  if (isSelectedModelReasoning()) return getReasoningModelAnswer;
  return getAzurAnswer;
}

function getAzurAnswer(success, chat) {
  const data = success.data;

  if (data === "[DONE]") return;

  if (data === "Error") {
    createErrorChat("사용자/사용량이 너무 많아서 잠시후 다시 시도해주세요");
    return;
  }

  const json = JSON.parse(data);
  const choices = json.choices || [];
  if (choices.length === 0) return;

  const choice = choices[0];
  if (choice.finish_reason !== null && choice.finish_reason !== undefined) return;

  const delta = choice.delta || {};
  const respCompletion = lastChatInfo.value;
  const responseInfo = {
    id: chat[G.RESPONSE_MESSAGE_ID],
    role: delta.role || "assistant",
    intention: chat[G.INTENTION],
    isRAG: chat[G.RAG],
  };

  if (addRespCompleted(respCompletion?.role === "response", responseInfo)) return;

  nextTick(() => {
    if (!lastChatInfo.value) return;
    lastChatInfo.value.content += delta.content || "";
    setIsHandle();
  });

  createTimer();
}

function getSkillSetAnswer(success, chat) {
  const json = JSON.parse(success.data);

  if (json.data === "[DONE]") return;

  const status = json.status;
  if (status !== undefined && status.code !== undefined) {
    createErrorChat("사용자/사용량이 너무 많아서 잠시후 다시 시도해주세요");
    return;
  }

  const respCompletion = lastChatInfo.value;

  if (respCompletion?.role === "response") {
    if (json.text !== undefined) {
      const response = createChatResponse({
        id: chat[G.RESPONSE_MESSAGE_ID],
        content: json.text,
        role: "assistant",
        status: "streaming",
        intention: chat[G.INTENTION],
        isRAG: chat[G.RAG],
      });
      response.feedback = 0;
      setChatCompletions([
        ...chatCompletions.value.slice(0, chatCompletions.value.length - 1),
        response,
      ]);
    }

    createTimer();
    return;
  }

  nextTick(() => {
    if (!lastChatInfo.value) return;
    lastChatInfo.value.content += json.text || "";
    setIsHandle();
  });

  createTimer();
}

function getReasoningModelAnswer(success, chat) {
  const data = success.data;

  if (data === "[DONE]") return;

  if (data === "Error") {
    createErrorChat("사용자/사용량이 너무 많아서 잠시후 다시 시도해주세요");
    return;
  }

  const json = JSON.parse(data);
  const choices = json.choices || [];
  if (choices.length === 0) return;

  const choice = choices[0];
  const finishReason = choice.finish_reason;
  if (finishReason !== undefined && finishReason !== null) return;

  const delta = choice.delta || {};
  const respCompletion = lastChatInfo.value;
  const responseInfo = {
    id: chat[G.RESPONSE_MESSAGE_ID],
    role: delta.role || "assistant",
    intention: chat[G.INTENTION],
    isRAG: chat[G.RAG],
  };

  if (addRespCompleted(respCompletion?.role === "response", responseInfo)) return;

  nextTick(() => {
    if (!lastChatInfo.value) return;

    const reasoningContent = delta.reasoning_content;
    const content = delta.content;

    if (reasoningContent !== undefined && reasoningContent !== null) {
      lastChatInfo.value.reasoningContent += reasoningContent;
    } else if (content !== undefined && content !== null) {
      lastChatInfo.value.content += content;
    }

    setIsHandle();
  });

  createTimer();
}

function completeAnswer() {
  window.clearTimeout(completionTimer);
  eventSource?.removeEventListener?.("readystatechange", evtSrcReadyStateChange);
  eventSource?.close?.();
  eventSource = null;
  respondingInfo.value.curIdx = 0;
  respondingInfo.value.endIdx = 0;
  generationResolve?.();
  generationResolve = null;
  generationReject = null;
  getChatHistInfo();
}

async function createErrorChat(content) {
  if (isEmptyChat.value) return;

  chatStore.startWait();
  window.clearTimeout(completionTimer);

  if (eventSource !== null) {
    eventSource.removeEventListener?.("readystatechange", evtSrcReadyStateChange);
    eventSource.close?.();
    eventSource = null;
  }

  const chat = {
    chatId: selectedChatId.value,
    msgId: createId("message"),
    assistId: getSubmitAssistantId(),
    modelId: getSubmitModelId(),
    studio: selectedAssistInfo.value?.assistantType === "studio",
    body: content,
  };

  try {
    const errorCompletions = await loadGenerationErrorMessages(chat, {
      message: content,
    });
    callbackTrnFunc(
      {
        tranId: "createErrorChat",
        result: {res: errorCompletions, param: {}},
      },
      true
    );
  } catch (error) {
    logWarn("[ChatHistory] createErrorChat 오류:", error);
  } finally {
    generationReject?.(new Error(content));
    generationResolve = null;
    generationReject = null;
    chatStore.finishWait();
  }
}

function generation(genType, prompt) {
  isGeneration.value = true;
  respMsgId.value = prompt[G.RESPONSE_MESSAGE_ID];

  const base = shouldUseServerApi()
    ? SERVER_API_BASE_URL
    : DEFAULT_API_BASE_PATH;
  const url = `${base.replace(/\/$/, "")}/chat-message-history/${genType}generation.do`;

  eventSource = new SSE(url, {
    headers: {"Content-Type": "application/json"},
    payload: JSON.stringify(prompt),
    method: "POST",
  });

  const onmessageFunc = getOnMessageFunc();
  let isStart = false;

  eventSource.onmessage = (success) => {
    if (!validateBefOnMessaging(success.data)) return;

    if (!isStart) {
      isStart = true;
      getAssocInfo();
    }

    onmessageFunc(success, prompt);
  };

  const errorMessage = "서비스에 문제로 인하여 잠시 후 시도하세요.";
  eventSource.onerror = () => {
    createErrorChat(errorMessage);
  };

  eventSource.addEventListener("readystatechange", evtSrcReadyStateChange);

  createTimer();
  eventSource.stream();

  return new Promise((resolve, reject) => {
    generationResolve = resolve;
    generationReject = reject;
  });
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

function canSubmitChatMessage() {
  return (
    !isReadOnlyChat.value &&
    !chatStore.isWait &&
    !chatStore.activeSession?.isModelUnavailable
  );
}

function setTemCompletion(userPrompt) {
  setChatCompletions([...chatCompletions.value, userPrompt]);
  setWaitingResponse(false);
}

function setWaitingResponse(isReplace) {
  const waitingCompletion = createChatResponse(
    createAssistantStreamingPatch(isSelectedModelReasoning())
  );
  waitingCompletion.role = "response";
  waitingCompletion.content = "답변 생성 중...";

  if (isReplace) {
    setChatCompletions([
      ...chatCompletions.value.slice(0, chatCompletions.value.length - 1),
      waitingCompletion,
    ]);
  } else {
    setChatCompletions([...chatCompletions.value, waitingCompletion]);
  }

  setAutoScroll();
}

async function getLLMAnswer(payload = {}) {
  if (chatStore.isActiveSharedRoom || !canSubmitChatMessage()) return;

  const promptPayload = {
    text: payload.text || "",
    attachments: payload.attachments || [],
    keyboardOpenOnSubmit: Boolean(payload.keyboardOpenOnSubmit),
  };

  if (!promptPayload.text && promptPayload.attachments.length === 0) return;

  chatStore.startWait();
  isGeneration.value = true;

  try {
    let chatId = chatStore.selectedChatId;

    if (!chatId) {
      const history = await createConversation(promptPayload);
      chatId = history.chatId;
      generateChatId = chatId;
      promptControlStore.promoteDraftPromptToolSettingsToChat(chatId);
      await getRoomInfo();
      await enterNewSubmitChatRoom(router, chatId);
    } else {
      generateChatId = chatId;
      void getRoomInfo();
    }

    const prompt = getChatInfo(promptPayload, chatId);
    const userPrompt = createChatUser(promptPayload);
    userPrompt.id = prompt[G.MESSAGE_ID];
    userPrompt.intention = prompt[G.INTENTION];
    userPrompt.isRAG = prompt[G.RAG];
    userPrompt.isRagCot = prompt[G.RAG_COT];
    userPrompt.imgS3Path = prompt[G.IMAGE_S3_PATH_LEGACY];

    setTemCompletion(userPrompt);
    await nextTick();
    setAutoScroll();
    await generation("", prompt);
  } catch (error) {
    if (!isAbortError(error)) logWarn("[ChatHistory] getLLMAnswer 종료:", error);
  } finally {
    generateChatId = null;
    isGeneration.value = false;
    chatStore.finishWait();
  }
}

async function setChatInputField(payload) {
  await getLLMAnswer(payload);
  if (chatStore.input === payload) chatStore.clearInput();
}

function findChatUserForRegenerate(assistantMessage) {
  const assistantIndex = chatCompletions.value.findIndex(
    (message) => message.id === assistantMessage.id
  );
  for (let index = assistantIndex - 1; index >= 0; index -= 1) {
    if (chatCompletions.value[index].role === "user") return chatCompletions.value[index];
  }
  return null;
}

async function reGeneration(assistantMessage) {
  if (!canSubmitChatMessage()) return;

  const chatId = chatStore.selectedChatId;
  const user = findChatUserForRegenerate(assistantMessage);
  if (!chatId || !user) return;

  chatStore.startWait();
  isGeneration.value = true;

  try {
    const assistantIndex = chatCompletions.value.findIndex(
      (chatCompletion) => chatCompletion.id === assistantMessage.id
    );
    setChatCompletions(chatCompletions.value.slice(0, assistantIndex));

    const newChatInfo = getChatInfo(
      {text: user.content, attachments: user.attachments || []},
      chatId
    );
    newChatInfo[G.INTENTION] = user.intention;
    newChatInfo[G.RAG] = user.isRAG;
    newChatInfo.befMsgId = getFileFlag(user.id) ? user.id : null;

    setWaitingResponse(false);
    await nextTick();
    setAutoScroll();
    await generation("re-", newChatInfo);
  } catch (error) {
    if (!isAbortError(error)) logWarn("[ChatHistory] reGeneration 종료:", error);
  } finally {
    isGeneration.value = false;
    chatStore.finishWait();
  }
}

function getFileFlag(userMsgId) {
  return (
    messageFileHist.value.findIndex((file) => userMsgId === file.msgId) !== -1 ||
    chatImageList.value.findIndex((image) => userMsgId === image.msgId) !== -1
  );
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

  for (let index = chatCompletions.value.length - 1; index >= 0; index -= 1) {
    const current = chatCompletions.value[index];
    if (current.role === "assistant") return current.id === message.id;
  }

  return false;
}

function scrollDown() {
  if (isHndleScroll.value) return false;

  nextTick(() => {
    window.setTimeout(() => {
      const bodyContents = scrollRef.value;
      if (!bodyContents) return;

      bodyContents.scrollTop = bodyContents.scrollHeight;
      updateBottomState();
    }, 0);
  });

  return true;
}

function scrollToTop() {
  const bodyContents = scrollRef.value;
  if (!bodyContents) return false;

  bodyContents.scrollTop = 0;
  updateBottomState();
  return true;
}

function setIsHandle() {
  const bodyContents = scrollRef.value;
  if (!bodyContents) return;

  isHndleScroll.value =
    bodyContents.scrollTop + bodyContents.clientHeight <
    bodyContents.scrollHeight - 24;

  if (!isHndleScroll.value) scrollDown();
}

function setAutoScroll() {
  isHndleScroll.value = false;
  scrollDown();
}

function scrollToChatId() {
  const scrollRequest = chatStore.consumeInitialScrollRequest?.();
  const searchMessageId =
    scrollRequest?.messageId || chatStore.searchTargetMessageId || null;

  if (searchMessageId) {
    const targetMessage = chatCompletions.value.find((chatCompletion) => {
      const raw = chatCompletion?.raw || {};
      return [
        chatCompletion?.id,
        raw.id,
        raw.msgId,
        raw.respMsgId,
        raw.messageId,
        raw.targetMessageId,
        raw.message_id,
      ]
        .filter((value) => value !== null && value !== undefined && value !== "")
        .some((value) => String(value) === String(searchMessageId));
    });

    const target = targetMessage?.id
      ? scrollRef.value?.querySelector(`[data-message-id="${targetMessage.id}"]`)
      : null;

    if (target) {
      target.scrollIntoView({behavior: "instant", block: "start"});
      chatStore.clearSearchTargetMessageId?.();
      updateBottomState();
      return;
    }
  }

  if (isSharedPage.value || isSharedChat(activeHistory.value)) {
    scrollToTop();
    return;
  }

  setAutoScroll();
}

function isNearBottom() {
  const bodyContents = scrollRef.value;
  if (!bodyContents) return true;
  return (
    bodyContents.scrollHeight - bodyContents.scrollTop - bodyContents.clientHeight <=
    24
  );
}

function updateBottomState() {
  chatStore.setShowScrollBottom(isConversationPage.value && !isNearBottom());
}

function handleScroll() {
  setIsHandle();
  updateBottomState();
}

function handleMessageRendered(payload) {
  markHistoryMessageRendered(payload);
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
      scrollToChatId();
      return;
    }

    setAutoScroll();
  }
);

watch(
  () => chatStore.input,
  async (payload) => {
    if (!payload) return;
    await setChatInputField(payload);
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
    isChangeChatId.value = true;
    clearMessagesOnConversationChange();
    await getChatHistInfo();
  },
  {immediate: true}
);

onBeforeUnmount(() => {
  abortLoadRequest();
  cancelHistoryRenderPresentation();
  clearChatCompletions();
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
