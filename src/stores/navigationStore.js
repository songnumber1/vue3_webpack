import {defineStore} from "pinia";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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
