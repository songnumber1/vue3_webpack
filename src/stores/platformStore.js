import {defineStore} from "pinia";
import {resolveDetailedPlatform} from "@/platform/platformDetector";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const usePlatformStore = defineStore("platform", {
  state: () => ({
    info: resolveDetailedPlatform(),
    nativeEvents: [],
    lastNativeEvent: null,
    network: {
      online: typeof navigator === "undefined" ? true : navigator.onLine,
    },
    pushToken: "",
    appVersionInfo: null,
  }),
  getters: {
    isAccess: (state) => state.info.isAccess,
    isAndroidApp: (state) => state.info.isAndroidApp,
    isIos: (state) => state.info.isIos,
    isWindowsWeb: (state) => state.info.isWindows && !state.info.isNativeApp,
  },
  actions: {
    initialize(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform(baseAppInfo);
      this.network.online =
        typeof navigator === "undefined" ? true : navigator.onLine;
    },
    refresh(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform({...this.info, ...baseAppInfo});
    },
    setPushToken(token) {
      this.pushToken = token || "";
    },
    setAppVersionInfo(data) {
      this.appVersionInfo = data || null;
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (data?.appVersion) this.info.appVersion = data.appVersion;
    },
    setNetwork(status = {}) {
      this.network = {...this.network, ...status};
    },
    recordNativeEvent(type, payload = {}) {
      const item = {type, payload, receivedAt: new Date().toISOString()};
      this.lastNativeEvent = item;
      this.nativeEvents = [item, ...this.nativeEvents].slice(0, 50);
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (type === "ON_NETWORK_CHANGE")
        this.setNetwork(payload.status || payload);
    },
  },
});
