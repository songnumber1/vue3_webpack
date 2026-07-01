import {defineStore} from "pinia";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {ACTIVE_ROOM_TYPES, normalizeActiveRoomType} from "@/constants/chatRoom";

export {ACTIVE_ROOM_TYPES};

function normalizeId(value) {
  return String(value || "").trim();
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    histories: [],
    selectedChatId: null,
    activeRoomId: null,
    activeRoomType: null,
    pendingSelectedChatId: null,
    activeSession: null,
    messageMap: {},
    pendingNewSubmitChatIds: {},
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
    getHistory(id) {
      return (
        this.histories.find((item) => String(item.id) === String(id)) || null
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

      this.clearPendingSelectedChatId();
      usePromptControlStore().resetActivePromptToolSettings();
    },
    clearActiveSession() {
      this.activeSession = null;
      this.selectedChatId = null;
      this.clearActiveRoom();
      usePromptControlStore().setActivePromptToolSettingsKey(null);
      this.clearPendingSelectedChatId();
      usePromptControlStore().resetActivePromptToolSettings();
    },
    setPendingSelectedChatId(chatId) {
      const id = normalizeId(chatId);
      this.pendingSelectedChatId = id || null;
    },
    clearPendingSelectedChatId() {
      this.pendingSelectedChatId = null;
    },
    setMessages(chatId, messages = []) {
      this.messageMap = {
        ...this.messageMap,
        [chatId]: messages,
      };
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
      this.histories = [
        history,
        ...this.histories.filter((item) => item.id !== history.id),
      ];
    },
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
  },
});
