import {defineStore} from 'pinia'
import {resolveDetailedPlatform} from '@/platform/platformDetector'

export const usePlatformStore = defineStore('platform', {
  state: () => ({
    info: resolveDetailedPlatform(),
    nativeEvents: [],
    lastNativeEvent: null,
    network: { online: typeof navigator === 'undefined' ? true : navigator.onLine },
    pushToken: '',
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
      this.info = resolveDetailedPlatform(baseAppInfo)
      this.network.online = typeof navigator === 'undefined' ? true : navigator.onLine
    },
    refresh(baseAppInfo = {}) {
      this.info = resolveDetailedPlatform({...this.info, ...baseAppInfo})
    },
    setPushToken(token) { this.pushToken = token || '' },
    setAppVersionInfo(data) { this.appVersionInfo = data || null; if (data?.appVersion) this.info.appVersion = data.appVersion },
    setNetwork(status = {}) { this.network = {...this.network, ...status} },
    recordNativeEvent(type, payload = {}) {
      const item = {type, payload, receivedAt: new Date().toISOString()}
      this.lastNativeEvent = item
      this.nativeEvents = [item, ...this.nativeEvents].slice(0, 50)
      if (type === 'ON_NETWORK_CHANGE') this.setNetwork(payload.status || payload)
    },
  },
})
