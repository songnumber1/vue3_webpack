import {defineStore} from "pinia";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";

export {ACTIVE_ROOM_TYPES};

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
    initialScrollRequest: null,
    activeSession: null,
    showScrollBottom: false,
    scrollRequestSeq: 0,
    scrollRequest: null,
    input: null,
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
    setInput(payload = null) {
      this.input = payload;
    },
    clearInput() {
      this.input = null;
    },
    setHistories(histories = []) {
      this.histories = histories;
    },
    getHistory(chatId) {
      if (!chatId) return null;
      return this.histories.find((item) => item.chatId === chatId) || null;
    },
    setActiveRoom(roomId, roomType = ACTIVE_ROOM_TYPES.chat) {
      this.activeRoomId = roomId || null;
      this.activeRoomType = roomId ? roomType : null;
    },
    setActiveChatRoom(chatId) {
      this.selectedChatId = chatId || null;
      this.setActiveRoom(chatId, ACTIVE_ROOM_TYPES.chat);
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

      if (session?.chatId) {
        this.setActiveChatRoom(session.chatId);
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
      this.clearActiveRoom();
      usePromptControlStore().setActivePromptToolSettingsKey(null);
      this.clearSearchTargetMessageId();
      this.clearInitialScrollRequest();
      this.clearInput();
      usePromptControlStore().resetActivePromptToolSettings();
    },
    setSearchTargetMessageId(messageId) {
      this.searchTargetMessageId = messageId || null;
    },
    clearSearchTargetMessageId() {
      this.searchTargetMessageId = null;
    },
    setInitialScrollRequest(request = null) {
      if (!request?.type) {
        this.initialScrollRequest = null;
        return;
      }

      this.initialScrollRequest = {
        type: request.type,
        messageId: request.messageId || null,
      };
    },
    clearInitialScrollRequest() {
      this.initialScrollRequest = null;
    },
    consumeInitialScrollRequest() {
      const request = this.initialScrollRequest;
      this.initialScrollRequest = null;
      return request;
    },
    setShowScrollBottom(value) {
      this.showScrollBottom = Boolean(value);
    },
    requestScrollToBottom(options = {}) {
      this.scrollRequestSeq += 1;
      this.scrollRequest = {type: "bottom", options};
    },
    requestScrollToTop(options = {}) {
      this.scrollRequestSeq += 1;
      this.scrollRequest = {type: "top", options};
    },
    requestScrollToMessage(messageId, options = {}) {
      if (!messageId) return;
      this.scrollRequestSeq += 1;
      this.scrollRequest = {type: "message", messageId, options};
    },
    addHistory(history) {
      if (!history?.chatId) return;
      this.histories = [
        history,
        ...this.histories.filter((item) => item.chatId !== history.chatId),
      ];
    },
  },
});
