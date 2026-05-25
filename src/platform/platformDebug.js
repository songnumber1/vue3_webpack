/**
 * @file platform/platformDebug.js
 * @description 브라우저/모바일/WebView 실행 환경 차이를 흡수하는 platform 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
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
