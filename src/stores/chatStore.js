import {defineStore} from "pinia";

const DEFAULT_PROMPT_TOOL_SETTINGS = Object.freeze({
  knowledgeSearch: [],
  webSearch: null,
});

function clonePromptToolSettings(settings = {}) {
  return {
    knowledgeSearch: Array.isArray(settings.knowledgeSearch)
      ? [...settings.knowledgeSearch]
      : [],
    webSearch: settings.webSearch || null,
  };
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    histories: [],
    selectedChatId: null,
    activeSession: null,
    messageMap: {},
    promptToolSettingsMap: {},
  }),
  getters: {
    activeHistory: (state) =>
      state.histories.find(
        (item) => String(item.id) === String(state.selectedChatId)
      ) || null,
    activeMessages: (state) =>
      state.selectedChatId ? state.messageMap[state.selectedChatId] || [] : [],
    isModelLocked: (state) => Boolean(state.activeSession?.readonlyModel),
    activePromptToolSettings: (state) => {
      const chatId = state.selectedChatId || "__draft__";
      return clonePromptToolSettings(
        state.promptToolSettingsMap[chatId] || DEFAULT_PROMPT_TOOL_SETTINGS
      );
    },
  },
  actions: {
    setHistories(histories = []) {
      this.histories = histories;
    },
    getHistory(id) {
      return (
        this.histories.find((item) => String(item.id) === String(id)) || null
      );
    },
    setActiveSession(session = null) {
      this.activeSession = session;
      this.selectedChatId = session?.chatId || null;
    },
    clearActiveSession() {
      this.activeSession = null;
      this.selectedChatId = null;
    },
    setMessages(chatId, messages = []) {
      this.messageMap = {
        ...this.messageMap,
        [chatId]: messages,
      };
    },
    addHistory(history) {
      this.histories = [
        history,
        ...this.histories.filter((item) => item.id !== history.id),
      ];
    },
    getPromptToolSettingsKey() {
      return this.selectedChatId || "__draft__";
    },
    ensurePromptToolSettings() {
      const chatId = this.getPromptToolSettingsKey();
      if (!this.promptToolSettingsMap[chatId]) {
        this.promptToolSettingsMap = {
          ...this.promptToolSettingsMap,
          [chatId]: clonePromptToolSettings(DEFAULT_PROMPT_TOOL_SETTINGS),
        };
      }
      return chatId;
    },
    togglePromptToolOption(groupId, optionId, selectionMode = "multiple") {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(this.promptToolSettingsMap[chatId]);

      if (selectionMode === "single") {
        current[groupId] = current[groupId] === optionId ? null : optionId;
      } else {
        const values = Array.isArray(current[groupId]) ? current[groupId] : [];
        current[groupId] = values.includes(optionId)
          ? values.filter((value) => value !== optionId)
          : [...values, optionId];
      }

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
  },
});
