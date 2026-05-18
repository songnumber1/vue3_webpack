import {isAndroidApp, isIosApp} from "@/core/config";
import {logWarn} from "@/utils/logger";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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

/**
 * @description resolveBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveBridge(appInfo) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAndroidApp(appInfo) && window.AndroidBridge)
    return window.AndroidBridge;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isIosApp(appInfo) && window.webkit?.messageHandlers?.AppBridge) {
    return window.webkit.messageHandlers.AppBridge;
  }

  return noopBridge;
}
