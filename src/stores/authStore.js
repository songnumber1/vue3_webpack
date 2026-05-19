import {defineStore} from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    accessInfo: null,
    user: null,
    isRagAuth: false,
    sourceOptions: [],
    externalOptions: [],
    authChecked: false,
    isAuthenticated: false,
    authFailureReason: null,
    authErrorMessage: "",
  }),
  getters: {
    userName: (state) => state.user?.userName || "",
    userId: (state) => state.user?.userId || "",
  },
  actions: {
    setAccessInfo(accessInfo = {}) {
      this.accessInfo = accessInfo || null;
      this.user = accessInfo?.user || null;
      this.isRagAuth = Boolean(accessInfo?.isRagAuth);
      this.sourceOptions = accessInfo?.sourceOptions || [];
      this.externalOptions = accessInfo?.externalOptions || [];
    },

    setAuthenticatedAccessInfo(accessInfo = {}) {
      this.setAccessInfo(accessInfo);
      this.authChecked = true;
      this.isAuthenticated = true;
      this.authFailureReason = null;
      this.authErrorMessage = "";
    },

    setAuthFailure(reason, accessInfo = {}) {
      this.setAccessInfo(accessInfo);
      this.authChecked = true;
      this.isAuthenticated = false;
      this.authFailureReason = reason;
      this.authErrorMessage = "";
    },

    setAuthError(error) {
      this.accessInfo = null;
      this.user = null;
      this.isRagAuth = false;
      this.sourceOptions = [];
      this.externalOptions = [];
      this.authChecked = true;
      this.isAuthenticated = false;
      this.authFailureReason = "AUTH_ERROR";
      this.authErrorMessage =
        error?.message || "[authStore] Login verification failed.";
    },

    resetAuth() {
      this.accessInfo = null;
      this.user = null;
      this.isRagAuth = false;
      this.sourceOptions = [];
      this.externalOptions = [];
      this.authChecked = false;
      this.isAuthenticated = false;
      this.authFailureReason = null;
      this.authErrorMessage = "";
    },
  },
});
