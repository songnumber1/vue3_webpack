export default {
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


  setAssistantsExpanded({ commit }, v) {
    commit("SET_ASSISTANTS_EXPANDED", v);
  },

  toggleAssistantsExpanded({ commit }) {
    commit("TOGGLE_ASSISTANTS_EXPANDED");
  },
};
