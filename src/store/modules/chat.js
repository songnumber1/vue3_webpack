import {
  loadStore,
  saveStore,
  normalizeStore,
} from "@/storage/chatStore";

export default {
  namespaced: true,

  state: () => ({
    store: normalizeStore(loadStore()),
  }),

  getters: {
    safeStore: (s) => s.store,
    activeChat: (s) => {
      const store = s.store || {};
      const chats = Array.isArray(store.chats) ? store.chats : [];
      const id = store.activeChatId;
      return chats.find((c) => c.id === id) || null;
    },
    activeMessages: (s, g) => {
      const chat = g.activeChat;
      if (!chat) return [];
      return Array.isArray(chat.messages) ? chat.messages : [];
    },
    isDraft: (s) => !!(s.store && s.store.draft),
    activeChatTitle: (s, g) => {
      const chat = g.activeChat;
      return chat?.title || "Chat";
    },
  },

  mutations: {
    SET_STORE(state, next) {
      state.store = normalizeStore(next);
    },
  },

  actions: {
    update({ commit }, next) {
      const normalized = normalizeStore(next);
      commit("SET_STORE", normalized);
      saveStore(normalized);
    },

    // 현재 선택된 모델(group/model)을 chat store에도 동기화
    syncActiveModel({ getters, dispatch }, { groupId, modelId }) {
      const s = { ...(getters.safeStore || {}) };
      if (groupId) s.activeModelGroupId = groupId;
      if (modelId) s.activeModelId = modelId;

      const chat = (s.chats || []).find((c) => c.id === s.activeChatId);
      if (chat) {
        if (groupId) chat.modelGroupId = groupId;
        if (modelId) chat.modelId = modelId;
      }

      dispatch("update", s);
    },
  },
};
