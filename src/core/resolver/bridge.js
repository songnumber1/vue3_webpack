/**
 * @file core/resolver/bridge.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {isAndroidApp} from "@/core/config";
import {logWarn} from "@/utils/logger";

const noopBridge = {
  getToken: () => null,
  getStorage: () => null,
  setStorage: () => {},
  toast: (message) => {
    logWarn("[native-toast:fallback]", message);
  },
  requestPermission: () => Promise.resolve(false),
  uploadFile: () =>
    Promise.reject(new Error("Native upload is not available.")),
};
export function resolveBridge(appInfo) {
  if (isAndroidApp(appInfo) && window.AndroidBridge) return window.AndroidBridge;

  return noopBridge;
}
