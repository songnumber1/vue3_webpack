import {defineStore} from "pinia";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const useAssistantStore = defineStore("assistant", {
  state: () => ({
    assistants: [],
    assistantMap: {},
    models: [],
    allModels: [],
    modelMap: {},
    modelMapByAssistant: {},
    selectedAssistantId: "",
    selectedModelId: "",
    examplePromptMap: {},
  }),
  getters: {
    currentAssistant: (state) =>
      state.assistantMap[state.selectedAssistantId] ||
      state.assistants[0] ||
      null,
    currentModels: (state) =>
      state.modelMapByAssistant[state.selectedAssistantId] || [],
    currentModel: (state) => state.modelMap[state.selectedModelId] || null,
  },
  actions: {
    setBootstrapData(payload = {}) {
      this.assistants = payload.assistants || [];
      this.assistantMap = payload.assistantMap || {};
      this.models = payload.models || [];
      this.allModels = payload.allModels || payload.models || [];
      this.modelMap = payload.modelMap || {};
      this.modelMapByAssistant = payload.modelMapByAssistant || {};
      this.selectedAssistantId =
        payload.initialAssistantId || this.assistants[0]?.id || "";
      this.selectedModelId =
        payload.initialModelId || this.currentModels[0]?.id || "";
      this.examplePromptMap = payload.examplePromptMap || {};
    },
    selectAssistant(id) {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!this.assistantMap[id]) return;
      this.selectedAssistantId = id;
      const models = this.modelMapByAssistant[id] || [];
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!models.some((model) => model.id === this.selectedModelId)) {
        this.selectedModelId = models[0]?.id || "";
      }
    },
    selectModel(id) {
      const model = this.modelMap[id];
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!model) return;
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (model.assistId !== this.selectedAssistantId) return;
      this.selectedModelId = id;
    },
    setExamplePrompts(assistantId, prompts = []) {
      this.examplePromptMap = {
        ...this.examplePromptMap,
        [assistantId]: prompts,
      };
    },
    setExamplePromptMap(promptMap = {}) {
      this.examplePromptMap = {...promptMap};
    },
  },
});
