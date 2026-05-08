import { isAndroidApp, isIosApp } from '@/core/config'

const noopBridge = {
  getToken: () => null,
  getStorage: () => null,
  setStorage: () => {},
  toast: (message) => {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message)
    } else {
      console.warn(message)
    }
  },
  requestPermission: () => Promise.resolve(false),
  uploadFile: () => Promise.reject(new Error('Native upload is not available.'))
}

export function resolveBridge(appInfo) {
  if (isAndroidApp(appInfo) && window.AndroidBridge) return window.AndroidBridge
  if (isIosApp(appInfo) && window.webkit?.messageHandlers?.AppBridge) {
    return window.webkit.messageHandlers.AppBridge
  }

  return noopBridge
}
