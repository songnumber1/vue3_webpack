import {defineStore} from 'pinia';
import {resolveDetailedPlatform} from '@/platform/platformDetector';
import {MOBILE_BREAKPOINT_PX} from '@/constants/uiTokens';

function getViewportInfo() {
  if (typeof window === 'undefined') {
    return {width: 0, height: 0, isCompact: false};
  }
  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const height = window.innerHeight || document.documentElement.clientHeight || 0;
  return {
    width,
    height,
    isCompact: width <= MOBILE_BREAKPOINT_PX,
  };
}

/**
 * @description 플랫폼/viewport 판별의 single source of truth입니다.
 */
export const usePlatformStore = defineStore('platform', {
  state: () => ({
    info: resolveDetailedPlatform(),
    viewport: getViewportInfo(),
    nativeEvents: [],
    lastNativeEvent: null,
    network: {
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
    },
    pushToken: '',
    appVersionInfo: null,
  }),
  getters: {
    isAccess: (state) => state.info.isAccess,
    isAndroidApp: (state) => state.info.isAndroidApp,
    isIos: (state) => state.info.isIos,
    isWindowsWeb: (state) => state.info.isWindows && !state.info.isNativeApp,
    isMobileUi: (state) =>
      Boolean(state.info.isMobile || state.info.isNativeApp || state.viewport.isCompact),
    isCompactViewport: (state) => state.viewport.isCompact,
  },
  actions: {
    initialize(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform(baseAppInfo);
      this.viewport = getViewportInfo();
      this.network.online =
        typeof navigator === 'undefined' ? true : navigator.onLine;
    },
    refresh(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform({...this.info, ...baseAppInfo});
      this.viewport = getViewportInfo();
    },
    refreshViewport() {
      this.viewport = getViewportInfo();
      this.info = {
        ...this.info,
        viewport: {
          width: this.viewport.width,
          height: this.viewport.height,
        },
        updatedAt: new Date().toISOString(),
      };
    },
    setPushToken(token) {
      this.pushToken = token || '';
    },
    setAppVersionInfo(data) {
      this.appVersionInfo = data || null;
      if (data?.appVersion) this.info.appVersion = data.appVersion;
    },
    setNetwork(status = {}) {
      this.network = {...this.network, ...status};
    },
    recordNativeEvent(type, payload = {}) {
      const item = {type, payload, receivedAt: new Date().toISOString()};
      this.lastNativeEvent = item;
      this.nativeEvents = [item, ...this.nativeEvents].slice(0, 50);
      if (type === 'ON_NETWORK_CHANGE') {
        this.setNetwork(payload.status || payload);
      }
    },
  },
});
