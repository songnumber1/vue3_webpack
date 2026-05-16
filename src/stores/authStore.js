import {defineStore} from "pinia";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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
        error?.message || "로그인 확인 중 오류가 발생했습니다.";
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
