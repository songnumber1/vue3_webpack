/**
 * @file assistantStore.js
 * @description JavaScript module for assistantStore.
 */

import {defineStore} from "pinia";

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
    },
    selectAssistant(id) {
      if (!this.assistantMap[id]) return;
      this.selectedAssistantId = id;
      const models = this.modelMapByAssistant[id] || [];
      if (!models.some((model) => model.id === this.selectedModelId)) {
        this.selectedModelId = models[0]?.id || "";
      }
    },
    selectModel(id) {
      const model = this.modelMap[id];
      if (!model) return;
      if (model.assistId !== this.selectedAssistantId) return;
      this.selectedModelId = id;
    },
    setExamplePrompts(assistantId, prompts = []) {
      this.examplePromptMap = {
        ...this.examplePromptMap,
        [assistantId]: prompts,
      };
    },
  },
});
