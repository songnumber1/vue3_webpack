export default {
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
};
