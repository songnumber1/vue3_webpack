/**
 * @file platform/viewport/viewportMode.js
 * @description 브라우저 viewport, VisualViewport, 모바일 키보드, safe-area 관련 런타임 보정 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";
import {logPlatformDebug} from "@/platform/platformDebug";

const VIEWPORT_MODE_CLASSES = Object.freeze({
  mobile: "mobile-mode",
  desktop: "desktop-mode",
});

let cleanupViewportModeListeners = null;

/**
 * @description visualViewport가 있으면 키보드/모바일 브라우저 보정값을 우선 사용하고,
 * 없으면 layout viewport 기준으로 현재 화면 너비를 반환합니다.
 * @returns {number} 현재 viewport 너비입니다.
 */
function getViewportModeWidth() {
  if (typeof window === "undefined") return 0;
  const visualWidth = Math.round(window.visualViewport?.width || 0);
  const layoutWidth = Math.round(window.innerWidth || 0);
  const candidates = [visualWidth, layoutWidth].filter(
    (width) => Number.isFinite(width) && width > 0
  );

  return candidates.length ? Math.min(...candidates) : 0;
}

function shouldForceMobileMode(settings = getRuntimeSystemSettings()) {
  return [
    PLATFORM_OVERRIDE_MODES.androidChrome,
    PLATFORM_OVERRIDE_MODES.androidWebView,
  ].includes(settings.platformOverride);
}

export function isMobileLikeViewport(
  breakpoint = getRuntimeSystemSettings().mobileBreakpoint
) {
  const settings = getRuntimeSystemSettings();
  if (shouldForceMobileMode(settings)) return true;
  const width = getViewportModeWidth();
  return width > 0 && width <= breakpoint;
}

/**
 * @description body에 mobile-mode/desktop-mode 클래스를 반영합니다.
 * CSS는 이 클래스를 기준으로 모바일/웹 분기를 적용합니다.
 * @param {number} breakpoint - 모바일 전환 기준 너비입니다.
 * @returns {boolean} 모바일 모드 여부입니다.
 */
export function syncViewportModeClass(
  breakpoint = getRuntimeSystemSettings().mobileBreakpoint
) {
  if (typeof document === "undefined") return false;
  const settings = getRuntimeSystemSettings();
  const width = getViewportModeWidth();
  const isMobile = shouldForceMobileMode(settings) || (width > 0 && width <= breakpoint);
  const {body} = document;

  if (!body) return isMobile;
  body.classList.toggle(VIEWPORT_MODE_CLASSES.mobile, isMobile);
  body.classList.toggle(VIEWPORT_MODE_CLASSES.desktop, !isMobile);
  body.dataset.viewportMode = isMobile ? "mobile" : "desktop";
  body.style.setProperty("--viewport-mode-breakpoint", `${breakpoint}px`);

  logPlatformDebug("viewport.mode", {
    width,
    breakpoint,
    viewportMode: isMobile ? "mobile" : "desktop",
    bodyClass: {
      mobile: body.classList.contains(VIEWPORT_MODE_CLASSES.mobile),
      desktop: body.classList.contains(VIEWPORT_MODE_CLASSES.desktop),
    },
  });

  return isMobile;
}

/**
 * @description viewport 변경 시 body viewport mode 클래스를 자동 갱신합니다.
 * @param {number} breakpoint - 모바일 전환 기준 너비입니다.
 * @returns {Function} 이벤트 리스너 해제 함수입니다.
 */
export function installViewportModeClass(breakpoint = null) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  if (cleanupViewportModeListeners) {
    cleanupViewportModeListeners();
  }

  const sync = () =>
    syncViewportModeClass(
      breakpoint || getRuntimeSystemSettings().mobileBreakpoint
    );
  sync();

  window.addEventListener("resize", sync, {passive: true});
  window.addEventListener("orientationchange", sync, {passive: true});
  window.visualViewport?.addEventListener("resize", sync, {passive: true});

  cleanupViewportModeListeners = () => {
    window.removeEventListener("resize", sync);
    window.removeEventListener("orientationchange", sync);
    window.visualViewport?.removeEventListener("resize", sync);
    cleanupViewportModeListeners = null;
  };

  return cleanupViewportModeListeners;
}
