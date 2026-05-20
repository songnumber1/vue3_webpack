import {defineStore} from "pinia";

export const useApiRequestStore = defineStore("apiRequest", {
  state: () => ({
    activeOverlayCount: 0,
    controllers: {},
  }),
  getters: {
    isOverlayVisible: (state) => state.activeOverlayCount > 0,
  },
  actions: {
    startOverlay() {
      this.activeOverlayCount += 1;
    },
    stopOverlay() {
      this.activeOverlayCount = Math.max(this.activeOverlayCount - 1, 0);
    },
    registerController(key, controller) {
      if (!key || !controller) return;
      this.controllers = {...this.controllers, [key]: controller};
    },
    unregisterController(key) {
      if (!key || !this.controllers[key]) return;
      const next = {...this.controllers};
      delete next[key];
      this.controllers = next;
    },
    abort(key) {
      if (key && this.controllers[key]) {
        this.controllers[key].abort();
        this.unregisterController(key);
        return;
      }
      Object.values(this.controllers).forEach((controller) => controller?.abort?.());
      this.controllers = {};
    },
  },
});
