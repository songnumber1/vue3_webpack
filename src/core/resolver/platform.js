/**
 * @file platform.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {
  detectBrowserPlatform,
  resolveAppConfig,
  isNativeApp,
} from "@/core/config";

/**
 * @deprecated appInfo 기준의 resolveAppConfig()를 사용하세요.
 * 기존 import 호환을 위해 남겨둔 래퍼입니다.
 */
export function resolvePlatform() {
  return resolveAppConfig().platform;
}

/**
 * @deprecated 화면/기능 분기는 platform 단독이 아니라 appInfo.env를 함께 사용하세요.
 */
export function isMobileLikePlatform(platform = detectBrowserPlatform()) {
  const appInfo = resolveAppConfig();
  return isNativeApp(appInfo) && appInfo.platform === platform;
}
