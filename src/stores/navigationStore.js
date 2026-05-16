/**
 * @file navigationStore.js
 * @description Stores navigation-only UI state shared by ChatLayout and AppSidebar.
 */

import {defineStore} from "pinia";

/**
 * Navigation UI state store.
 *
 * method: Pinia store
 * payload: sidebar/drawer visibility state
 * response: reactive navigation state/actions
 * 특징: ChatContainer → ChatLayout → AppSidebar prop drilling을 줄이기 위해 UI navigation 상태를 중앙화합니다.
 */
export const useNavigationStore = defineStore("navigation", {
  state: () => ({
    sidebarCollapsed: false,
    drawerOpen: false,
    collapsedRecentOpen: false,
  }),
  actions: {
    setSidebarCollapsed(value) {
      this.sidebarCollapsed = Boolean(value);
    },
    setDrawerOpen(value) {
      this.drawerOpen = Boolean(value);
    },
    setCollapsedRecentOpen(value) {
      this.collapsedRecentOpen = Boolean(value);
    },
    closeTransientPanels() {
      this.drawerOpen = false;
      this.collapsedRecentOpen = false;
    },
  },
});
