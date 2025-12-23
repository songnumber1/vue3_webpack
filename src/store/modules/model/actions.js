export default {
  // Assistant(=group) 선택: 마지막 사용 모델로 자동 변경
  selectGroup({ commit, dispatch, state }, groupId) {
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
};
