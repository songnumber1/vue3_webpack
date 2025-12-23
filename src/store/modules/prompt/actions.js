export default {
  onModelChanged({ commit, getters, rootState }) {
    const modelId = rootState.model.modelId;
    const list = getters.templatesForModel(modelId);
    const t = list.find((x)=>x.default) || list[0];
    if (!t) {
      commit("SET_SELECTED_TEMPLATE", { id: null, name: null });
      commit("RESET_SELECTIONS");
      return;
    }
    commit("SET_SELECTED_TEMPLATE", { id: t.promptTemplateId, name: t.promptTemplateName });
    commit("RESET_SELECTIONS");
  },

  selectTemplate({ commit, getters, rootState }, templateId) {
    const modelId = rootState.model.modelId;
    const list = getters.templatesForModel(modelId);
    const t = list.find((x)=> x.promptTemplateId === templateId);
    if (!t) return;
    commit("SET_SELECTED_TEMPLATE", { id: t.promptTemplateId, name: t.promptTemplateName });
    commit("RESET_SELECTIONS");
  },

  toggleMode({ getters, dispatch, rootState }, name) {
    const modelId = rootState.model.modelId;
    const list = getters.templatesForModel(modelId);
    if (!list.length) return;

    const current = getters.currentTemplate;
    if (current?.promptTemplateName === name) {
      // 같은 버튼 다시 누르면 '직접입력'(default 혹은 이름 매칭)으로 복귀
      const direct = list.find((t)=> t.promptTemplateName === "직접입력") || list.find((t)=> t.default) || list[0];
      if (direct) dispatch("selectTemplate", direct.promptTemplateId);
      return;
    }
    const next = list.find((t)=> t.promptTemplateName === name);
    if (next) dispatch("selectTemplate", next.promptTemplateId);
  },

  setOption({ commit }, { key, value }) {
    commit("SET_SELECTION", { key, value });
  },
};
