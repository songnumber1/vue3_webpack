/**
 * @file layout.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import WebLayout from "@/layouts/WebLayout.vue";
import AndroidLayout from "@/layouts/AndroidLayout.vue";
import { isAndroidApp } from "@/core/config";

/**
 * resolveLayout 함수입니다.
 * @param {*} appInfo 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function resolveLayout(appInfo) {
  return isAndroidApp(appInfo) ? AndroidLayout : WebLayout;
}
