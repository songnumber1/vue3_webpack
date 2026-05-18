import {defineStore} from "pinia";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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
