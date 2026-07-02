import {defineStore} from "pinia";
import {resolveDetailedPlatform} from "@/platform/platformDetector";
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
    isNativeRuntime: (state) =>
      state.info.isNativeRuntime || state.info.isNativeApp,
    isAndroidApp: (state) => state.info.isAndroidApp,
    isBrowserRuntime: (state) => state.info.isBrowserRuntime,
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
      if (data?.appVersion) this.info.appVersion = data.appVersion; // 원시 탐색 인포 버전도 최신 스펙으로 하향 패치 수립
    },
    recordNativeEvent(type, payload = {}) {
      const item = {type, payload, receivedAt: new Date().toISOString()};
      this.lastNativeEvent = item;
      this.nativeEvents = [item, ...this.nativeEvents].slice(0, 50);

      if (type === "ON_NETWORK_CHANGE") {
        this.network = {...this.network, ...(payload.status || payload)};
      }
    },
  },
});
