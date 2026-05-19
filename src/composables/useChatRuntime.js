import {computed} from "vue";
import {storeToRefs} from "pinia";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {
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
function createLocalHistory({text, assistant, model}) {
  const id = `chat-local-${Date.now()}`;

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
function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
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
    if (!chatStore.isModelLocked) return assistantStore.currentModels;

    return [assistantStore.modelMap[chatStore.activeSession?.modelId]].filter(
      Boolean
    );
  });
  const selectedModel = computed({
    get: () => chatStore.activeSession?.modelId || selectedModelId.value,
    set: (id) => {
      if (chatStore.isModelLocked) return;
      assistantStore.selectModel(id);
    },
  });
  const isModelLocked = computed(() => chatStore.isModelLocked);
  const conversations = computed(() => chatStore.messageMap);
  async function initialize() {
    if (appRuntimeStore.initialized || appRuntimeStore.loading) return;
    appRuntimeStore.startLoading();
    try {
      const data = await bootstrapChatRuntime({
        accessInfoOverride: authStore.accessInfo || null,
      });
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
  async function ensureConversation(historyId) {
    const history = getHistory(historyId);
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

    if (displayAssistant?.id) {
      assistantStore.selectAssistant(displayAssistant.id);
      session.displayAssistantId = displayAssistant.id;
      session.displayAssistantLabel = displayAssistant.label;
    }

    chatStore.setActiveSession(session);

    if (!chatStore.messageMap[history.id]) {
      const messages = await loadChatMessages({
        chatId: history.id,
        assistId: session?.assistantId || history.assistantId,
        modelId: session?.modelId || history.modelId,
        studio: session?.assistantType === "studio",
      });
      chatStore.setMessages(history.id, messages);
    }

    return chatStore.messageMap[history.id] || [];
  }
  function setConversation(historyId, messages) {
    chatStore.setMessages(historyId, messages);
  }
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

    return history;
  }
  function clearCurrentChatSelection() {
    chatStore.clearActiveSession();
  }
  function revokeMessageAttachments(items = []) {
    items.forEach((message) => {
      if (!Array.isArray(message.attachments)) return;
      message.attachments.forEach((file) => {
        if (file?.url?.startsWith?.("blob:")) URL.revokeObjectURL(file.url);
      });
    });
  }
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

    return {messages: nextMessages, assistantMessage};
  }

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
