import {defineStore} from "pinia";

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
