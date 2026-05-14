/**
 * @file bridge.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { isAndroidApp, isIosApp } from "@/core/config";

const noopBridge = {
  getToken: () => null,
  getStorage: () => null,
  setStorage: () => {},
  toast: (message) => {
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(message);
    } else {
      console.warn(message);
    }
  },
  requestPermission: () => Promise.resolve(false),
  uploadFile: () => Promise.reject(new Error("Native upload is not available."))
};

/**
 * resolveBridge 함수입니다.
 * @param {*} appInfo 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function resolveBridge(appInfo) {
  if (isAndroidApp(appInfo) && window.AndroidBridge) return window.AndroidBridge;
  if (isIosApp(appInfo) && window.webkit?.messageHandlers?.AppBridge) {
    return window.webkit.messageHandlers.AppBridge;
  }

  return noopBridge;
}
