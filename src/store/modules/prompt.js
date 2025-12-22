import rawTemplates from "@/data/data.json";

function byOrder(a, b) {
  return (a.promptTemplateOrder ?? 0) - (b.promptTemplateOrder ?? 0);
}

function safeArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeTemplate(t) {
  return {
    delYN: !!t.delYN,
    default: !!t.default,
    promptTemplateOrder: Number.isFinite(t.promptTemplateOrder) ? t.promptTemplateOrder : 0,
    modelId: String(t.modelId ?? ""),
    promptTemplateId: String(t.promptTemplateId ?? ""),
    promptTemplate: t.promptTemplate && typeof t.promptTemplate === "object" ? t.promptTemplate : {},
    promptTemplateName: String(t.promptTemplateName ?? ""),
  };
}

export default {
  namespaced: true,

  state: () => ({
    templates: safeArray(rawTemplates).map(normalizeTemplate),

    // 선택된 템플릿
    selectedTemplateId: "",
    selectedTemplateName: "",

    // 각 템플릿 옵션(라디오 등) 선택값
    selections: {},
  }),

  getters: {
    templatesForModel: (state) => (modelId) => {
      return state.templates
        .filter((t) => !t.delYN && t.modelId === modelId)
        .slice()
        .sort(byOrder);
    },

    hasMultipleModes: (state, getters, rootState) => {
      const list = getters.templatesForModel(rootState.model.modelId);
      const names = new Set(list.map((t) => t.promptTemplateName));
      // "직접입력"만 있으면 단일 모드로 간주
      return names.size > 1;
    },

    currentTemplate: (state, getters, rootState) => {
      const list = getters.templatesForModel(rootState.model.modelId);
      return list.find((t) => t.promptTemplateId === state.selectedTemplateId) || null;
    },

    headerText: (state, getters, rootState) => {
      const lang = rootState.model.language;
      const tpl = getters.currentTemplate;
      if (!tpl) return { title: "", content: "" };

      // Case1: html header (title+content)
      const html = tpl.promptTemplate?.html;
      if (html && html[lang]) {
        return {
          title: String(html[lang].title ?? ""),
          content: String(html[lang].content ?? ""),
        };
      }

      // Case2: template name-based header
      const name = tpl.promptTemplateName || "";
      const title = lang === "en" ? name : name; // 필요시 다국어 맵 추가 가능
      return { title, content: "" };
    },

    optionSchema: (state, getters) => {
      const tpl = getters.currentTemplate;
      if (!tpl) return {};
      const pt = tpl.promptTemplate;
      // html 제외
      const out = {};
      for (const [k, v] of Object.entries(pt || {})) {
        if (k === "html") continue;
        if (v && typeof v === "object" && v.type) out[k] = v;
      }
      return out;
    },

    selectedOptions: (state) => state.selections || {},
  },

  mutations: {
    SET_SELECTED_TEMPLATE(state, { id, name }) {
      state.selectedTemplateId = id;
      state.selectedTemplateName = name;
    },
    SET_SELECTION(state, { key, value }) {
      state.selections = { ...(state.selections || {}), [key]: value };
    },
    RESET_SELECTIONS(state) {
      state.selections = {};
    },
  },

  actions: {
    onModelChanged({ state, commit, getters, rootState }) {
      const modelId = rootState.model.modelId;
      const list = getters.templatesForModel(modelId);
      const def = list.find((t) => t.default) || list[0] || null;

      const still = list.find((t) => t.promptTemplateId === state.selectedTemplateId);
      const next = still || def;

      commit(
        "SET_SELECTED_TEMPLATE",
        next
          ? { id: next.promptTemplateId, name: next.promptTemplateName }
          : { id: "", name: "" }
      );
      commit("RESET_SELECTIONS");
    },

    // 멀티 모드 UI에서: 특수 템플릿 토글. 해제되면 "직접입력"으로 자동 복귀
    toggleMode({ dispatch, getters, rootState }, name) {
      const modelId = rootState.model.modelId;
      const list = getters.templatesForModel(modelId);
      const current = getters.currentTemplate;

      if (!name) return;

      // 현재가 name이면 해제 -> 직접입력
      if (current && current.promptTemplateName === name) {
        const direct = list.find((t) => t.promptTemplateName === "직접입력") || list.find((t) => t.default) || list[0];
        if (direct) dispatch("selectTemplate", direct.promptTemplateId);
        return;
      }

      const found = list.find((t) => t.promptTemplateName === name);
      if (found) dispatch("selectTemplate", found.promptTemplateId);
    },

    selectTemplate({ commit, getters, rootState }, templateId) {
      const modelId = rootState.model.modelId;
      const list = getters.templatesForModel(modelId);
      const t = list.find((x) => x.promptTemplateId === templateId);
      if (!t) return;
      commit("SET_SELECTED_TEMPLATE", { id: t.promptTemplateId, name: t.promptTemplateName });
      commit("RESET_SELECTIONS");
    },

    setOption({ commit }, { key, value }) {
      commit("SET_SELECTION", { key, value });
    },
  },
};
