import { defineStore } from "pinia";
import rawData from "@/data/data.json";
import { JSON_KEYS } from "@/constants/jsonKeys";

export const useDataStore = defineStore("data", {
  state: () => ({
    data: rawData,
  }),

  getters: {
    assistants(state) {
      return state.data?.[JSON_KEYS.ASSISTANTS] || [];
    },

    /** UI helper: assistants for sidebar */
    uiAssistants() {
      return (this.assistants || [])
        .filter((a) => a?.delYN !== true)
        .map((a) => ({
          id: a?.[JSON_KEYS.ASSISTANT_ID] ?? a?.assistant_id ?? a?.id,
          label: a?.[JSON_KEYS.NAME_KO] || a?.name_ko || a?.label || "",
          icon: a?.icon || a?.[JSON_KEYS.ICON] || "🤖",
          modelIds: Array.isArray(a?.[JSON_KEYS.MODEL_IDS])
            ? a[JSON_KEYS.MODEL_IDS]
            : Array.isArray(a?.modelIds)
            ? a.modelIds
            : [],
        }));
    },

    /** UI helper: assistants for sidebar */
    uiAssistants() {
      return (this.assistants || [])
        .filter((a) => a?.delYN !== true)
        .map((a) => ({
          id: a?.[JSON_KEYS.ASSISTANT_ID] ?? a?.assistant_id ?? a?.id,
          label: a?.[JSON_KEYS.NAME_KO] || a?.name_ko || a?.label || "",
          icon: a?.icon || a?.[JSON_KEYS.ICON] || "🤖",
          modelIds: Array.isArray(a?.[JSON_KEYS.MODEL_IDS])
            ? a[JSON_KEYS.MODEL_IDS]
            : Array.isArray(a?.modelIds)
            ? a.modelIds
            : [],
        }));
    },

    /** UI helper: assistants for sidebar */
    uiAssistants() {
      return this.assistants
        .filter((a) => a?.delYN !== true)
        .map((a) => ({
          id: a[JSON_KEYS.ASSISTANT_ID] ?? a.assistant_id ?? a.id,
          label: a[JSON_KEYS.NAME_KO] || a.name_ko || a.label || "",
          icon: a.icon || a[JSON_KEYS.ICON] || "🤖",
          modelIds: Array.isArray(a[JSON_KEYS.MODEL_IDS])
            ? a[JSON_KEYS.MODEL_IDS]
            : a.modelIds || [],
        }));
    },

    models(state) {
      return state.data?.[JSON_KEYS.MODELS] || [];
    },

    prompts(state) {
      return state.data?.[JSON_KEYS.PROMPTS] || [];
    },

    examples(state) {
      return state.data?.[JSON_KEYS.EXAMPLES] || [];
    },

    /** Assistant → Models */
    modelsByAssistant() {
      return (assistantId) =>
        this.models.filter(
          (m) => m[JSON_KEYS.ASSISTANT_ID] === assistantId && m.delYN !== true
        );
    },

    /** Model → Examples */
    examplesByModel() {
      return (modelId) =>
        this.examples.filter(
          (e) => e[JSON_KEYS.MODEL_ID] === modelId && e.delYN !== true
        );
    },

    /** Model → Prompts (InputHeader) */
    promptsByModel() {
      return (modelId) =>
        this.prompts.filter(
          (p) => p[JSON_KEYS.MODEL_ID] === modelId && p.delYN !== true
        );
    },
  },
  actions: {
    /** ✅ FIX: assistant_id 기준으로 model 필터 */
    modelsByAssistant(assistantId) {
      if (!assistantId) return [];

      return (this.models || []).filter(
        (m) =>
          m?.[JSON_KEYS.ASSISTANT_ID] === assistantId &&
          m?.[JSON_KEYS.DEL_YN] !== true
      );
    },

    /** model_id 기준 prompts */
    promptsByModel(modelId) {
      if (!modelId) return [];

      return (this.prompts || []).filter(
        (p) =>
          p?.[JSON_KEYS.MODEL_ID] === modelId && p?.[JSON_KEYS.DEL_YN] !== true
      );
    },
  },
});
