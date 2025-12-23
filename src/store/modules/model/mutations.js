import { getDefaultModelId } from "./state";

export default {
  SET_GROUP(state, groupId) {
    state.groupId = groupId;
    // 그룹 변경 시 현재 모델은 마지막 사용 모델이 있으면 우선, 없으면 기본값
    const remembered = state.lastUsedModelByGroup?.[groupId];
    state.modelId = remembered || getDefaultModelId(groupId);
  },
  SET_MODEL(state, modelId) {
    state.modelId = modelId;
    if (state.groupId) {
      state.lastUsedModelByGroup[state.groupId] = modelId;
    }
  },
  SET_LANGUAGE(state, lang) {
    state.language = lang;
  },
};
