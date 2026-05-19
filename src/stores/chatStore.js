import {defineStore} from "pinia";

export const useChatStore = defineStore("chat", {
  state: () => ({
    histories: [],
    selectedChatId: null,
    activeSession: null,
    messageMap: {},
  }),
  getters: {
    activeHistory: (state) =>
      state.histories.find(
        (item) => String(item.id) === String(state.selectedChatId)
      ) || null,
    activeMessages: (state) =>
      state.selectedChatId ? state.messageMap[state.selectedChatId] || [] : [],
    isModelLocked: (state) => Boolean(state.activeSession?.readonlyModel),
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
  },
});
