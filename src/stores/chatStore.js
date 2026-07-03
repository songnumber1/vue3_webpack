import {defineStore} from "pinia";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {ACTIVE_ROOM_TYPES, normalizeActiveRoomType} from "@/constants/chatRoom";

export {ACTIVE_ROOM_TYPES};

export function normalizeHistoryChatId(history) {
  return String(history?.chatId || "").trim();
}

function normalizeId(value) {
  return String(value || "").trim();
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    assistants: [],
    assistantMap: {},
    models: [],
    allModels: [],
    modelMap: {},
    modelMapByAssistant: {},
    selectedAssistantId: "",
    selectedModelId: "",
    examplePromptMap: {},
    promptTemplates: [],
    histories: [],
    selectedChatId: null,
    activeRoomId: null,
    activeRoomType: null,
    searchTargetMessageId: null,
    activeSession: null,
    messageMap: {},
    activeMessages: [],
    showScrollBottom: false,
    isHistoryRendering: false,
    historyMarkdownVisible: false,
    historyMessagesLoaded: false,
    pendingNewSubmitChatIds: {},
    pendingSubmitPayload: null,
    isWait: false,
  }),
  getters: {
    currentAssistant: (state) =>
      state.assistantMap[state.selectedAssistantId] ||
      state.assistants[0] ||
      null,
    currentModels: (state) =>
      state.modelMapByAssistant[state.selectedAssistantId] || [],
    currentModel: (state) => state.modelMap[state.selectedModelId] || null,
    isActiveSharedRoom: (state) =>
      state.activeRoomType === ACTIVE_ROOM_TYPES.shared,
    isModelLocked: (state) => Boolean(state.activeSession?.readonlyModel),
  },
  actions: {
    setBootstrapData(payload = {}) {
      this.assistants = payload.assistants || [];
      this.assistantMap = payload.assistantMap || {};
      this.models = payload.models || [];
      this.allModels = payload.allModels || payload.models || [];
      this.modelMap = payload.modelMap || {};
      this.modelMapByAssistant = payload.modelMapByAssistant || {};
      this.selectedAssistantId =
        payload.initialAssistantId || this.assistants[0]?.id || "";
      this.selectedModelId =
        payload.initialModelId || this.currentModels[0]?.id || "";
      this.examplePromptMap = payload.examplePromptMap || {};
      this.promptTemplates = payload.promptTemplates || [];
    },
    selectAssistant(id) {
      if (!this.assistantMap[id]) return;
      this.selectedAssistantId = id;

      const models = this.modelMapByAssistant[id] || [];
      if (!models.some((model) => model.id === this.selectedModelId)) {
        this.selectedModelId = models[0]?.id || "";
      }
    },
    selectModel(id) {
      const model = this.modelMap[id];
      if (!model) return;
      if (model.assistId !== this.selectedAssistantId) return;
      this.selectedModelId = id;
    },
    setExamplePrompts(assistantId, prompts = []) {
      this.examplePromptMap = {
        ...this.examplePromptMap,
        [assistantId]: prompts,
      };
    },
    startWait() {
      this.isWait = true;
    },
    finishWait() {
      this.isWait = false;
    },
    setPendingSubmitPayload(payload = null) {
      this.pendingSubmitPayload = payload;
    },
    consumePendingSubmitPayload() {
      const payload = this.pendingSubmitPayload;
      this.pendingSubmitPayload = null;
      return payload;
    },
    hasPendingSubmitPayload() {
      return Boolean(this.pendingSubmitPayload);
    },
    markPendingNewSubmitChat(chatId) {
      const id = normalizeId(chatId);
      if (!id) return;
      this.pendingNewSubmitChatIds = {
        ...this.pendingNewSubmitChatIds,
        [id]: true,
      };
    },
    consumePendingNewSubmitChat(chatId) {
      const id = normalizeId(chatId);
      if (!id || !this.pendingNewSubmitChatIds[id]) return false;
      const next = {...this.pendingNewSubmitChatIds};
      delete next[id];
      this.pendingNewSubmitChatIds = next;
      return true;
    },
    setHistories(histories = []) {
      this.histories = histories;
    },
    getHistory(chatId) {
      const id = normalizeId(chatId);
      if (!id) return null;
      return (
        this.histories.find((item) => normalizeHistoryChatId(item) === id) || null
      );
    },
    setActiveRoom(roomId, roomType = ACTIVE_ROOM_TYPES.chat) {
      const id = normalizeId(roomId);
      const type = normalizeActiveRoomType(roomType);
      this.activeRoomId = id || null;
      this.activeRoomType = id && type ? type : null;
    },
    setActiveChatRoom(chatId) {
      const id = normalizeId(chatId);
      this.selectedChatId = id || null;
      this.setActiveRoom(id, ACTIVE_ROOM_TYPES.chat);
      usePromptControlStore().setActivePromptToolSettingsKey(
        this.selectedChatId
      );
    },
    setActiveSharedRoom(shareId) {
      this.setActiveRoom(shareId, ACTIVE_ROOM_TYPES.shared);
    },
    clearActiveRoom() {
      this.activeRoomId = null;
      this.activeRoomType = null;
    },
    setActiveSession(session = null) {
      this.activeSession = session;
      const chatId = normalizeId(session?.chatId);

      if (chatId) {
        this.setActiveChatRoom(chatId);
      } else {
        this.selectedChatId = null;
        usePromptControlStore().setActivePromptToolSettingsKey(null);
        if (this.activeRoomType !== ACTIVE_ROOM_TYPES.shared) {
          this.clearActiveRoom();
        }
      }

      usePromptControlStore().resetActivePromptToolSettings();
    },
    clearActiveSession() {
      this.activeSession = null;
      this.selectedChatId = null;
      this.setActiveMessages([]);
      this.resetHistoryRenderState();
      this.clearActiveRoom();
      usePromptControlStore().setActivePromptToolSettingsKey(null);
      this.clearSearchTargetMessageId();
      usePromptControlStore().resetActivePromptToolSettings();
    },
    setSearchTargetMessageId(messageId) {
      const id = normalizeId(messageId);
      this.searchTargetMessageId = id || null;
    },
    clearSearchTargetMessageId() {
      this.searchTargetMessageId = null;
    },
    setActiveMessages(messages = []) {
      this.activeMessages = Array.isArray(messages) ? messages : [];
    },
    setShowScrollBottom(value) {
      this.showScrollBottom = Boolean(value);
    },
    setHistoryRenderState(state = {}) {
      if (Object.prototype.hasOwnProperty.call(state, "isHistoryRendering")) {
        this.isHistoryRendering = Boolean(state.isHistoryRendering);
      }
      if (Object.prototype.hasOwnProperty.call(state, "historyMarkdownVisible")) {
        this.historyMarkdownVisible = Boolean(state.historyMarkdownVisible);
      }
      if (Object.prototype.hasOwnProperty.call(state, "historyMessagesLoaded")) {
        this.historyMessagesLoaded = Boolean(state.historyMessagesLoaded);
      }
    },
    resetHistoryRenderState() {
      this.isHistoryRendering = false;
      this.historyMarkdownVisible = false;
      this.historyMessagesLoaded = false;
    },
    setMessages(chatId, messages = []) {
      const list = Array.isArray(messages) ? messages : [];
      this.messageMap = {
        ...this.messageMap,
        [chatId]: list,
      };
      if (normalizeId(chatId) === normalizeId(this.selectedChatId)) {
        this.setActiveMessages(list);
      }
    },
    pruneInactiveMessageCache(keepChatId) {
      const keepId = normalizeId(keepChatId);
      const nextMessageMap = {};

      Object.entries(this.messageMap || {}).forEach(([chatId, list]) => {
        if (String(chatId) === keepId) {
          nextMessageMap[chatId] = list;
        }
      });

      this.messageMap = nextMessageMap;
      usePromptControlStore().prunePromptToolSettingsCache(keepChatId);
    },
    addHistory(history) {
      const chatId = normalizeHistoryChatId(history);
      if (!chatId) return;
      this.histories = [
        history,
        ...this.histories.filter((item) => normalizeHistoryChatId(item) !== chatId),
      ];
    },
  },
});
