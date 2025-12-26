import { defineStore } from "pinia";
import { useDataStore } from "./dataStore";

export const usePromptStore = defineStore("prompt", {
  state: () => ({
    modelId: null,
    language: "ko",
  }),

  getters: {
    headerText(state) {
      if (!state.modelId) {
        return { title: "", content: "" };
      }

      const ds = useDataStore();
      const prompt = ds.promptsByModel(state.modelId)[0];

      if (!prompt) {
        return { title: "", content: "" };
      }

      return {
        title: state.language === "en" ? prompt.title_en : prompt.title_ko,
        content: state.language === "en" ? prompt.desc_en : prompt.desc_ko,
      };
    },
  },

  actions: {
    setModel(modelId) {
      this.modelId = modelId;
    },

    setLanguage(lang) {
      this.language = lang === "en" ? "en" : "ko";
    },
  },
});
