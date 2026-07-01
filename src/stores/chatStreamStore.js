import {defineStore} from "pinia";

export const useChatStreamStore = defineStore("chatStream", {
  state: () => ({
    isWait: false,
    allowedNavigation: null,
    pendingGeneration: null,
  }),
  actions: {
    startWait() {
      this.isWait = true;
    },
    finishWait() {
      this.isWait = false;
      this.clearAllowedNavigation();
    },
    allowNavigationTo(route = {}) {
      this.allowedNavigation = {
        name: route.name || null,
        params: {...(route.params || {})},
      };
    },
    consumeAllowedNavigation(to = {}) {
      const allowed = this.allowedNavigation;
      if (!allowed) return false;

      const isSameName =
        !allowed.name || String(to.name) === String(allowed.name);
      const isSameParams = Object.entries(allowed.params || {}).every(
        ([key, value]) => String(to.params?.[key] || "") === String(value || "")
      );

      if (isSameName && isSameParams) {
        this.clearAllowedNavigation();
        return true;
      }

      return false;
    },
    clearAllowedNavigation() {
      this.allowedNavigation = null;
    },
    setPendingGeneration(payload = null) {
      this.pendingGeneration = payload;
    },
    clearPendingGeneration() {
      this.pendingGeneration = null;
    },
  },
});
