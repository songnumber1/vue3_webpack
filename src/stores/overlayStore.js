import {defineStore} from 'pinia';

export const useOverlayStore = defineStore('overlay', {
  state: () => ({
    openMap: {},
    payloadMap: {},
  }),
  getters: {
    isOpen: (state) => (key) => Boolean(state.openMap[key]),
    payload: (state) => (key) => state.payloadMap[key] || null,
  },
  actions: {
    open(key, payload = null) {
      if (!key) return;
      this.openMap = {...this.openMap, [key]: true};
      if (payload !== undefined) {
        this.payloadMap = {...this.payloadMap, [key]: payload};
      }
    },
    close(key) {
      if (!key) return;
      this.openMap = {...this.openMap, [key]: false};
      const nextPayloadMap = {...this.payloadMap};
      delete nextPayloadMap[key];
      this.payloadMap = nextPayloadMap;
    },
    toggle(key, payload = null) {
      if (this.isOpen(key)) {
        this.close(key);
      } else {
        this.open(key, payload);
      }
    },
    closeMany(keys = []) {
      keys.forEach((key) => this.close(key));
    },
    closeAll() {
      this.openMap = {};
      this.payloadMap = {};
    },
  },
});
