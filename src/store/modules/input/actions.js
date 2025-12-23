export default {
  setText({ commit }, v) { commit("SET_TEXT", v); },
  clear({ commit }) { commit("CLEAR"); },
};
