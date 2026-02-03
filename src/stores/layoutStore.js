
import { defineStore } from "pinia";

export const useLayoutStore = defineStore("layout", {
  state: () => ({
    showHeader: true,
    showFooter: true,
    showSidebar: true,
    theme: "light"
  }),
  actions: {
    applyTheme() {
      document.documentElement.dataset.theme = this.theme;
    }
  }
});
