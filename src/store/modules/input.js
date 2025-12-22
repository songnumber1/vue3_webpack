export default {
  namespaced: true,

  state: () => ({
    text: "",
  }),

  getters: {
    text: (s) => s.text,
  },

  mutations: {
    SET_TEXT(state, v) {
      state.text = String(v ?? "");
    },
    CLEAR(state) {
      state.text = "";
    },
  },

  actions: {
    setText({ commit }, v) {
      commit("SET_TEXT", v);
    },
    clear({ commit }) {
      commit("CLEAR");
    },
  },
};
