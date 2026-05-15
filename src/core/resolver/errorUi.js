/**
 * @file errorUi.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {isNativeApp} from "@/core/config";

/**
 * resolveErrorUI 함수입니다.
 * @param {*} appInfo 함수 실행에 필요한 값입니다.
 * @param {*} bridge 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function resolveErrorUI(appInfo, bridge) {
  if (isNativeApp(appInfo)) {
    return {
      notify(message) {
        bridge?.toast?.(message);
      },
    };
  }

  return {
    notify(message) {
      console.warn(message);
    },
  };
}
