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
  },
};
