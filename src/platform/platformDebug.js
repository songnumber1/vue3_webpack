/**
 * @file platform/platformDebug.js
 * @description 브라우저/모바일/WebView 실행 환경 차이를 흡수하는 platform 계층입니다.
 */

const PLATFORM_DEBUG_PREFIX = "[platform-override-debug]";

/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function canUseConsole() {
  return typeof console !== "undefined" && typeof console.log === "function";
}

export function logPlatformDebug(scope, payload = {}) {
  if (!canUseConsole()) return;
  console.log(`${PLATFORM_DEBUG_PREFIX} ${scope}`, payload);
}
