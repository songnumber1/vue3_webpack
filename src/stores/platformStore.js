import {defineStore} from "pinia";
import {resolveDetailedPlatform} from "@/platform/platformDetector";
import {MOBILE_BREAKPOINT_PX} from "@/constants/uiTokens";

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
    viewportWatchStarted: false,
    viewportWatchTimer: 0,
    _viewportRefreshHandler: null,
  }),
  getters: {
    isAccess: (state) => state.info.isAccess,
    isAndroidApp: (state) => state.info.isAndroidApp,
    isIos: (state) => state.info.isIos,
    isWindowsWeb: (state) => state.info.isWindows && !state.info.isNativeApp,
    isMobileUi: (state) => {
      const viewportWidth = Number(state.info?.viewport?.width || 0);
      return Boolean(
        state.info?.isMobileBrowser ||
          state.info?.isAndroidApp ||
          state.info?.isIosApp ||
          (viewportWidth > 0 && viewportWidth <= MOBILE_BREAKPOINT_PX)
      );
    },
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
    refreshViewport(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform({...this.info, ...baseAppInfo});
    },
    startViewportWatch() {
      if (this.viewportWatchStarted || typeof window === "undefined") return;
      this.viewportWatchStarted = true;
      const refresh = () => {
        window.clearTimeout(this.viewportWatchTimer);
        this.refreshViewport();
        this.viewportWatchTimer = window.setTimeout(() => this.refreshViewport(), 80);
      };
      this._viewportRefreshHandler = refresh;
      window.addEventListener("resize", refresh, {passive: true});
      window.addEventListener("orientationchange", refresh, {passive: true});
      window.visualViewport?.addEventListener("resize", refresh, {passive: true});
      refresh();
    },
    stopViewportWatch() {
      if (!this.viewportWatchStarted || typeof window === "undefined") return;
      const refresh = this._viewportRefreshHandler;
      if (refresh) {
        window.removeEventListener("resize", refresh);
        window.removeEventListener("orientationchange", refresh);
        window.visualViewport?.removeEventListener("resize", refresh);
      }
      window.clearTimeout(this.viewportWatchTimer);
      this.viewportWatchTimer = 0;
      this._viewportRefreshHandler = null;
      this.viewportWatchStarted = false;
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
