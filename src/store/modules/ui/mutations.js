export default {
  SET_THEME(state, theme) {
    state.theme = theme || "light";
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

  SET_ASSISTANTS_EXPANDED(state, v) {
    state.assistantsExpanded = !!v;
  },
  TOGGLE_ASSISTANTS_EXPANDED(state) {
    state.assistantsExpanded = !state.assistantsExpanded;
  },
};
