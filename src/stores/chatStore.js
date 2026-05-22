import {defineStore} from "pinia";

const DRAFT_PROMPT_TOOL_SETTINGS_KEY = "__draft__";

const DEFAULT_PROMPT_TOOL_SETTINGS = Object.freeze({
  knowledgeSearch: [],
  webSearch: null,
  webSearchEnabled: false,
  promptTemplateId: null,
  promptTemplateOptions: {},
});

function clonePromptToolSettings(settings = {}) {
  return {
    knowledgeSearch: Array.isArray(settings.knowledgeSearch)
      ? [...settings.knowledgeSearch]
      : [],
    webSearch: settings.webSearch || null,
    webSearchEnabled: Boolean(settings.webSearchEnabled),
    promptTemplateId: settings.promptTemplateId || null,
    promptTemplateOptions: {...(settings.promptTemplateOptions || {})},
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
      const chatId = state.selectedChatId || DRAFT_PROMPT_TOOL_SETTINGS_KEY;
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
      this.resetActivePromptToolSettings();
    },
    clearActiveSession() {
      this.activeSession = null;
      this.selectedChatId = null;
      this.resetActivePromptToolSettings();
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
      return this.selectedChatId || DRAFT_PROMPT_TOOL_SETTINGS_KEY;
    },
    resetActivePromptToolSettings() {
      const chatId = this.getPromptToolSettingsKey();
      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: clonePromptToolSettings(DEFAULT_PROMPT_TOOL_SETTINGS),
      };
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


    resetActivePromptTemplate() {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );
      current.promptTemplateId = null;
      current.promptTemplateOptions = {};

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    setActivePromptTemplate(templateId) {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );
      const nextTemplateId = current.promptTemplateId === templateId ? null : templateId;
      current.promptTemplateId = nextTemplateId;
      current.promptTemplateOptions = {};

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    setPromptTemplateOption(groupId, optionTag) {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );
      current.promptTemplateOptions = {
        ...current.promptTemplateOptions,
        [groupId]: optionTag,
      };

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    setPromptToolGroupEnabled(groupId, enabled) {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );

      if (groupId === "webSearch") {
        current.webSearchEnabled = Boolean(enabled);
        if (!enabled) {
          current.webSearch = null;
        }
      }

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    togglePromptToolOption(groupId, optionId, selectionMode = "multiple") {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );

      if (selectionMode === "single") {
        current[groupId] = current[groupId] === optionId ? null : optionId;

        if (groupId === "webSearch") {
          current.webSearchEnabled = Boolean(current.webSearch);
        }
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
