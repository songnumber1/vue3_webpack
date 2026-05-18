import {computed} from "vue";
import {storeToRefs} from "pinia";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  bootstrapChatRuntime,
  deleteChatHistory,
  loadChatHistoryList,
  loadChatMessages,
  loadExamplePrompts,
  renameChatHistory,
  updateChatBookmark,
} from "@/business/chatBootstrap";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {useAuthStore} from "@/stores/authStore";
import {useChatStore} from "@/stores/chatStore";

/**
 * @description createLocalHistory 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createLocalHistory({text, assistant, model}) {
  const id = `chat-local-${Date.now()}`;
  // 계산된 결과를 호출부로 반환합니다.
  return {
    id,
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

/**
 * @description createSessionFromHistory 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} history - history 입력값입니다.
 * @param {*} modelMap - modelMap 입력값입니다.
 * @param {*} assistantMap - assistantMap 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!history) return null;
  const model = modelMap[history.modelId] || null;
  const assistant =
    assistantMap[history.assistantId || model?.assistId] || null;
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

  // 계산된 결과를 호출부로 반환합니다.
  return {
    chatId: history.id,
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

/**
 * @description useChatRuntime 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function useChatRuntime() {
  const appRuntimeStore = useAppRuntimeStore();
  const authStore = useAuthStore();
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();
  const {assistants, selectedAssistantId, selectedModelId, examplePromptMap} =
    storeToRefs(assistantStore);
  const {histories} = storeToRefs(chatStore);

  const currentAssistant = computed(
    () =>
      assistantStore.currentAssistant ||
      assistants.value[0] || {id: "", label: "Assistant", description: ""}
  );
  const currentExamplePrompts = computed(
    () => examplePromptMap.value[selectedAssistantId.value] || []
  );
  const activeSession = computed(() => chatStore.activeSession);
  const isActiveModelDeleted = computed(() =>
    Boolean(chatStore.activeSession?.isModelDeleted)
  );
  const isActiveModelUnavailable = computed(() =>
    Boolean(chatStore.activeSession?.isModelUnavailable)
  );
  const models = computed(() => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!chatStore.isModelLocked) return assistantStore.currentModels;
    // 계산된 결과를 호출부로 반환합니다.
    return [assistantStore.modelMap[chatStore.activeSession?.modelId]].filter(
      Boolean
    );
  });
  const selectedModel = computed({
    get: () => chatStore.activeSession?.modelId || selectedModelId.value,
    set: (id) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (chatStore.isModelLocked) return;
      assistantStore.selectModel(id);
    },
  });
  const isModelLocked = computed(() => chatStore.isModelLocked);
  const conversations = computed(() => chatStore.messageMap);

  /**
   * @description initialize 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function initialize() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (appRuntimeStore.initialized || appRuntimeStore.loading) return;
    appRuntimeStore.startLoading();
    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      const data = await bootstrapChatRuntime({
        accessInfoOverride: authStore.accessInfo || null,
      });
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (data.accessInfo?.user) {
        authStore.setAuthenticatedAccessInfo(data.accessInfo);
      } else {
        authStore.setAccessInfo(data.accessInfo);
      }
      assistantStore.setBootstrapData(data);
      chatStore.setHistories(data.chatHistories);
      appRuntimeStore.finishLoading();
    } catch (error) {
      appRuntimeStore.fail(error);
      throw error;
    }
  }

  async function refreshHistories() {
    try {
      const chatHistories = await loadChatHistoryList({
        assistantMap: assistantStore.assistantMap,
        modelMap: assistantStore.modelMap,
      });
      chatStore.setHistories(chatHistories);
      return chatHistories;
    } catch (error) {
      logWarn("[useChatRuntime] refreshHistories 오류:", error);
      return chatStore.histories;
    }
  }

  async function toggleHistoryBookmark(history) {
    if (!history?.id) return;
    try {
      await updateChatBookmark({
        chatId: history.id,
        bookmarkYN: !history.isPinned,
      });
      await refreshHistories();
    } catch (error) {
      logWarn("[useChatRuntime] toggleHistoryBookmark 오류:", error);
      throw error;
    }
  }

  async function renameHistory(history, title) {
    const chatTitle = String(title || "").trim();
    if (!history?.id || !chatTitle) return;
    try {
      await renameChatHistory({chatId: history.id, chatTitle});
      await refreshHistories();
    } catch (error) {
      logWarn("[useChatRuntime] renameHistory 오류:", error);
      throw error;
    }
  }

  async function removeHistory(history) {
    if (!history?.id) return;
    try {
      await deleteChatHistory({chatId: history.id});
      delete chatStore.messageMap[history.id];
      if (String(chatStore.selectedChatId) === String(history.id)) {
        chatStore.clearActiveSession();
      }
      await refreshHistories();
    } catch (error) {
      logWarn("[useChatRuntime] removeHistory 오류:", error);
      throw error;
    }
  }

  /**
   * @description preloadExamplePrompts 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} assistantId - assistantId 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function preloadExamplePrompts(assistantId) {
    if (!assistantId || assistantStore.examplePromptMap[assistantId]) return;
    try {
      const assistant = assistantStore.assistantMap[assistantId];
      const prompts = await loadExamplePrompts({
        assistantId,
        studioYN: assistant?.type === "studio",
      });
      assistantStore.setExamplePrompts(assistantId, prompts);
    } catch (error) {
      logWarn("[useChatRuntime] preloadExamplePrompts 오류:", error);
    }
  }

  async function selectAssistant(id, {forNewChat = false} = {}) {
    if (!forNewChat && chatStore.isModelLocked) return;
    try {
      assistantStore.selectAssistant(id);
      if (forNewChat) chatStore.clearActiveSession();
      await preloadExamplePrompts(id);
    } catch (error) {
      logWarn("[useChatRuntime] selectAssistant 오류:", error);
    }
  }

  function selectAssistantForNewChat(id) {
    return selectAssistant(id, {forNewChat: true});
  }

  function getHistory(id) {
    return chatStore.getHistory(id);
  }

  /**
   * @description ensureConversation 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} historyId - historyId 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function ensureConversation(historyId) {
    const history = getHistory(historyId);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!history) return [];

    const session = createSessionFromHistory(
      history,
      assistantStore.modelMap,
      assistantStore.assistantMap
    );
    const fallbackAssistant = assistantStore.assistants[0] || null;
    const shouldUseFallbackAssistant = Boolean(
      session?.isModelDeleted ||
      session?.isModelMissing ||
      session?.isAssistantMissing ||
      !session?.assistantId
    );
    const displayAssistant = shouldUseFallbackAssistant
      ? fallbackAssistant
      : assistantStore.assistantMap[session.assistantId] || fallbackAssistant;

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (displayAssistant?.id) {
      assistantStore.selectAssistant(displayAssistant.id);
      session.displayAssistantId = displayAssistant.id;
      session.displayAssistantLabel = displayAssistant.label;
    }

    chatStore.setActiveSession(session);

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!chatStore.messageMap[history.id]) {
      const messages = await loadChatMessages({
        chatId: history.id,
        assistId: session?.assistantId || history.assistantId,
        modelId: session?.modelId || history.modelId,
        studio: session?.assistantType === "studio",
      });
      chatStore.setMessages(history.id, messages);
    }

    // 계산된 결과를 호출부로 반환합니다.
    return chatStore.messageMap[history.id] || [];
  }

  /**
   * @description setConversation 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} historyId - historyId 입력값입니다.
   * @param {*} messages - messages 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function setConversation(historyId, messages) {
    chatStore.setMessages(historyId, messages);
  }

  /**
   * @description createLocalConversation 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} value - value 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function createLocalConversation({text} = {}) {
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
    // 계산된 결과를 호출부로 반환합니다.
    return history;
  }

  /**
   * @description clearCurrentChatSelection 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function clearCurrentChatSelection() {
    chatStore.clearActiveSession();
  }

  /**
   * @description revokeMessageAttachments 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} items - items 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function revokeMessageAttachments(items = []) {
    items.forEach((message) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!Array.isArray(message.attachments)) return;
      message.attachments.forEach((file) => {
        // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
        if (file?.url?.startsWith?.("blob:")) URL.revokeObjectURL(file.url);
      });
    });
  }

  /**
   * @description appendUserAndAssistantMessages 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} chatId - chatId 입력값입니다.
   * @param {*} normalized - normalized 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function appendUserAndAssistantMessages(chatId, normalized) {
    const currentMessages = chatStore.messageMap[chatId] || [];
    const userMessage = {
      id: createId("message"),
      role: "user",
      content: normalized.text,
      attachments: normalized.attachments,
      createdAt: new Date().toISOString(),
    };
    const assistantMessage = {
      id: createId("message"),
      role: "assistant",
      content: "",
      reasoningContent: "",
      reasoningStatus: "thinking",
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...currentMessages, userMessage, assistantMessage];
    chatStore.setMessages(chatId, nextMessages);
    // 계산된 결과를 호출부로 반환합니다.
    return {messages: nextMessages, assistantMessage};
  }

  // 계산된 결과를 호출부로 반환합니다.
  return {
    initialize,
    assistants,
    currentAssistant,
    currentExamplePrompts,
    histories,
    models,
    activeSession,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelDeleted,
    isActiveModelUnavailable,
    conversations,
    refreshHistories,
    toggleHistoryBookmark,
    renameHistory,
    removeHistory,
    selectAssistant,
    selectAssistantForNewChat,
    getHistory,
    ensureConversation,
    setConversation,
    createLocalConversation,
    clearCurrentChatSelection,
    appendUserAndAssistantMessages,
    revokeMessageAttachments,
  };
}
