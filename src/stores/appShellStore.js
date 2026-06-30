/**
 * @file stores/appShellStore.js
 * @description App shell에서 공유하는 가벼운 UI 상태를 관리합니다.
 */

import {defineStore} from "pinia";

export const useAppShellStore = defineStore("appShell", {
  state: () => ({
    themeName: "light",
    drawerOpen: false,
    assistantSheetOpen: false,
  }),
  actions: {
    setThemeName(nextTheme) {
      if (!nextTheme) return;
      this.themeName = nextTheme;
    },
    setDrawerOpen(value) {
      this.drawerOpen = Boolean(value);
    },
    closeTransientShellPanels() {
      this.drawerOpen = false;
      this.assistantSheetOpen = false;
    },
    openAssistantSheet() {
      this.assistantSheetOpen = true;
    },
    closeAssistantSheet() {
      this.assistantSheetOpen = false;
    },
  },
});
