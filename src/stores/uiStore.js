import { defineStore } from "pinia";

const LS_KEY = "ds_ui_v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch (e) {
    return {};
  }
}

function save(state) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        theme: state.theme,
        isMobile: state.isMobile,
        sidebarOpen: state.sidebarOpen,
})
    );
  } catch (e) {
    // ignore
  }
}

export const useUiStore = defineStore("ui", {
  state: () => {
    const base = load();
    return {
      theme: base.theme || "light",
      isMobile: !!base.isMobile,
      sidebarOpen: base.sidebarOpen !== undefined ? !!base.sidebarOpen : true,
      // Desktop-only: sidebar is always visible; use collapse instead
      sidebarHidden: false,
      sidebarCollapsed: false,
      assistantsExpanded: false,
      navLocked: false,
    };
  },

  actions: {
    /* ===== theme ===== */
    initTheme(theme) {
      if (theme) {
        this.theme = theme;
        save(this);
      }
    },

    setTheme(theme) {
      this.theme = theme;
      save(this);
    },

    /* ===== responsive ===== */
    setMobile(isMobile) {
      this.isMobile = !!isMobile;
      save(this);
    },

    /* ===== sidebar ===== */
    openSidebar() {
      this.sidebarOpen = true;
      save(this);
    },

    closeSidebar() {
      this.sidebarOpen = false;
      save(this);
    },

    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
      save(this);
    },

    /* ===== desktop sidebar visibility ===== */
    showSidebar() {
      this.sidebarHidden = false;
      save(this);
    },

    hideSidebar() {
      this.sidebarHidden = true;
      save(this);
    },

    toggleSidebarHidden() {
      this.sidebarHidden = !this.sidebarHidden;
      save(this);
    },

    toggleCollapse() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    /* ===== assistants ===== */
    toggleAssistantsExpanded() {
      this.assistantsExpanded = !this.assistantsExpanded;
    },

    /* ===== navigation lock ===== */
    lockNav() {
      this.navLocked = true;
    },

    unlockNav() {
      this.navLocked = false;
    },
  },
});
