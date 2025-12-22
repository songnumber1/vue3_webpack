export default {
  namespaced: true,

  state: () => ({
    theme: "light",
    isMobile: false,
    sidebarOpen: false,
    sidebarCollapsed: false,
  }),

  getters: {
    theme: (s) => s.theme,
    isMobile: (s) => s.isMobile,
    sidebarOpen: (s) => s.sidebarOpen,
    sidebarCollapsed: (s) => s.sidebarCollapsed,
  },

  mutations: {
    SET_THEME(state, t) {
      state.theme = String(t || "light");
    },
    SET_MOBILE(state, v) {
      state.isMobile = !!v;
    },
    SET_SIDEBAR_OPEN(state, v) {
      state.sidebarOpen = !!v;
    },
    TOGGLE_COLLAPSE(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    SET_COLLAPSE(state, v) {
      state.sidebarCollapsed = !!v;
    },
  },

  actions: {
    initTheme({ commit }, theme) {
      commit("SET_THEME", theme);
    },

    setTheme({ commit }, theme) {
      commit("SET_THEME", theme);
    },

    setMobile({ commit, state }, isMobile) {
      commit("SET_MOBILE", isMobile);
      // 데스크탑으로 전환되면 모바일 drawer는 닫기
      if (!isMobile && state.sidebarOpen) commit("SET_SIDEBAR_OPEN", false);
    },

    openSidebar({ commit }) {
      commit("SET_SIDEBAR_OPEN", true);
    },

    closeSidebar({ commit }) {
      commit("SET_SIDEBAR_OPEN", false);
    },

    toggleCollapse({ commit }) {
      commit("TOGGLE_COLLAPSE");
    },
  },
};
