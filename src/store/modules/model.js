import { MODEL_GROUPS, getDefaultModelId } from "@/constants/models";

export default {
  namespaced: true,

  state: () => ({
    groupId: MODEL_GROUPS?.[0]?.id || "ds",
    modelId: getDefaultModelId(MODEL_GROUPS?.[0]?.id || "ds"),
    language: "ko", // ko | en
  }),

  getters: {
    groupLabel: (s) =>
      (MODEL_GROUPS.find((g) => g.id === s.groupId) || {}).label || s.groupId,
    modelsForGroup: (s) =>
      (MODEL_GROUPS.find((g) => g.id === s.groupId) || {}).models || [],
  },

  mutations: {
    SET_GROUP(state, groupId) {
      state.groupId = groupId;
      state.modelId = getDefaultModelId(groupId);
    },
    SET_MODEL(state, modelId) {
      state.modelId = modelId;
    },
    SET_LANGUAGE(state, lang) {
      state.language = lang === "en" ? "en" : "ko";
    },
  },

  actions: {
    setGroup({ commit, dispatch, state }, groupId) {
      commit("SET_GROUP", groupId);
      dispatch("prompt/onModelChanged", null, { root: true });
      dispatch(
        "chat/syncActiveModel",
        { groupId: state.groupId, modelId: state.modelId },
        { root: true }
      );
    },
    setModel({ commit, dispatch, state }, modelId) {
      commit("SET_MODEL", modelId);
      dispatch("prompt/onModelChanged", null, { root: true });
      dispatch(
        "chat/syncActiveModel",
        { groupId: state.groupId, modelId: state.modelId },
        { root: true }
      );
    },
    setLanguage({ commit }, lang) {
      commit("SET_LANGUAGE", lang);
    },
  },
};
