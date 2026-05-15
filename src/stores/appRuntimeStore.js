/**
 * @file appRuntimeStore.js
 * @description JavaScript module for appRuntimeStore.
 */

import {defineStore} from "pinia";

export const useAppRuntimeStore = defineStore("appRuntime", {
  state: () => ({
    initialized: false,
    loading: false,
    error: null,
  }),
  actions: {
    startLoading() {
      this.loading = true;
      this.error = null;
    },
    finishLoading() {
      this.loading = false;
      this.initialized = true;
    },
    fail(error) {
      this.loading = false;
      this.error = error;
    },
  },
});
