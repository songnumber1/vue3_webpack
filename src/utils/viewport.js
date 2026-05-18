import {MOBILE_BREAKPOINT_PX} from "@/constants/uiTokens";
import {MOBILE_BROWSER_FAMILY, RUNTIME_CSS_VARS} from "@/constants/runtimeContracts";

export const DEFAULT_MOBILE_BREAKPOINT_PX = MOBILE_BREAKPOINT_PX;

/**
 * @description getMobileBrowserFamily 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function getMobileBrowserFamily() {
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/SamsungBrowser/i.test(userAgent)) return MOBILE_BROWSER_FAMILY.samsung;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Firefox/i.test(userAgent)) return MOBILE_BROWSER_FAMILY.firefox;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Chrome|CriOS|Chromium/i.test(userAgent)) return MOBILE_BROWSER_FAMILY.chrome;
  // 계산된 결과를 호출부로 반환합니다.
  return MOBILE_BROWSER_FAMILY.default;
}

/**
 * @description getViewportSize 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function getViewportSize() {
  const visualViewport =
    typeof window !== "undefined" ? window.visualViewport : null;
  // 계산된 결과를 호출부로 반환합니다.
  return {
    width: Math.round(visualViewport?.width || window.innerWidth || 0),
    height: Math.round(visualViewport?.height || window.innerHeight || 0),
    layoutWidth: Math.round(window.innerWidth || visualViewport?.width || 0),
    layoutHeight: Math.round(window.innerHeight || visualViewport?.height || 0),
    offsetTop: Math.round(visualViewport?.offsetTop || 0),
  };
}

/**
 * @description isMobileViewport 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} breakpoint - breakpoint 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isMobileViewport(breakpoint = DEFAULT_MOBILE_BREAKPOINT_PX) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined") return false;
  const width = Math.min(
    window.visualViewport?.width || window.innerWidth || 0,
    window.innerWidth || window.visualViewport?.width || 0
  );
  // 계산된 결과를 호출부로 반환합니다.
  return width > 0 && width <= breakpoint;
}

/**
 * @description readRootPixelVar 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} name - name 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function readRootPixelVar(name) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof document === "undefined") return 0;
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name);
  const parsed = Number.parseFloat(value || "0");
  // 계산된 결과를 호출부로 반환합니다.
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * @description getViewportHeight 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function getViewportHeight({minHeight = 320, fallback = 720} = {}) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined") return fallback;

  const visualHeight = Math.round(window.visualViewport?.height || 0);
  const innerHeight = Math.round(window.innerHeight || 0);
  const clientHeight = Math.round(document.documentElement?.clientHeight || 0);
  const appHeight = Math.round(readRootPixelVar(RUNTIME_CSS_VARS.appHeight) || 0);
  const candidates = [
    visualHeight,
    innerHeight,
    clientHeight,
    appHeight,
  ].filter((height) => Number.isFinite(height) && height >= minHeight);

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!candidates.length) return fallback;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isMobileViewport() && getMobileBrowserFamily() === MOBILE_BROWSER_FAMILY.firefox) {
    // 계산된 결과를 호출부로 반환합니다.
    return Math.max(Math.min(...candidates), minHeight);
  }
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isMobileViewport() && visualHeight > 0) {
    // 계산된 결과를 호출부로 반환합니다.
    return Math.max(visualHeight, minHeight);
  }
  // 계산된 결과를 호출부로 반환합니다.
  return Math.max(innerHeight || visualHeight || clientHeight, minHeight);
}

/**
 * @description getSafeAreaBottom 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function getSafeAreaBottom() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined" || typeof document === "undefined")
    return 0;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;bottom:env(safe-area-inset-bottom);height:0;visibility:hidden;";
  document.body.appendChild(probe);
  const value = Math.max(
    0,
    Math.round(window.innerHeight - probe.getBoundingClientRect().bottom)
  );
  probe.remove();
  // 계산된 결과를 호출부로 반환합니다.
  return Number.isFinite(value) ? value : 0;
}
