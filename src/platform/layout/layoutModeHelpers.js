/**
 * @file platform/layout/layoutModeHelpers.js
 * @description 화면 크기(layout mode) 판별을 실제 런타임(runtime mode)과 분리해 재사용하기 위한 helper입니다.
 *
 * 주의:
 * - 이 파일은 Android/PC 같은 실제 실행 환경을 판단하지 않습니다.
 * - layout mode는 viewport, body class, 모바일 브라우저 레이아웃 채택 여부만 다룹니다.
 * - OverlayScrollbar/키보드 정책은 runtime helper와 scroll policy에서 별도로 판단합니다.
 */

export const LAYOUT_MODE = Object.freeze({
  MOBILE: "mobile",
  DESKTOP: "desktop",
});

function isBrowserDocumentAvailable() {
  return typeof document !== "undefined" && Boolean(document.body);
}

/**
 * body가 mobile-mode 클래스를 가지고 있는지 확인합니다.
 * @returns {boolean} mobile-mode class가 있으면 true
 */
export function hasBodyMobileLayoutMode() {
  return Boolean(
    isBrowserDocumentAvailable() &&
    document.body.classList?.contains("mobile-mode")
  );
}

/**
 * body가 desktop-mode 클래스를 가지고 있는지 확인합니다.
 * @returns {boolean} desktop-mode class가 있으면 true
 */
export function hasBodyDesktopLayoutMode() {
  return Boolean(
    isBrowserDocumentAvailable() &&
    document.body.classList?.contains("desktop-mode")
  );
}

/**
 * viewport store와 body class를 결합해 compact viewport 여부를 계산합니다.
 * 기존 useRuntimeModeFlags의 isCompactViewport 계산식을 helper로 분리한 것입니다.
 * @param {object} options
 * @param {boolean} options.isCompactViewport - viewportStore.isCompact 값
 * @param {boolean} options.hasBodyMobileMode - body.mobile-mode 여부
 * @returns {boolean} compact/mobile viewport이면 true
 */
export function resolveCompactViewportFlag({
  isCompactViewport = false,
  hasBodyMobileMode = false,
} = {}) {
  return Boolean(isCompactViewport || hasBodyMobileMode);
}

/**
 * 모바일 레이아웃을 사용할지 계산합니다.
 * 실제 런타임 판별 자체는 하지 않고, 호출부에서 이미 계산된 layout 후보 flag만 결합합니다.
 * 기존 shouldUseMobileLayout 계산식과 동일한 의미를 유지합니다.
 * @param {object} options
 * @param {boolean} options.isCompactViewport - compact viewport 여부
 * @param {boolean} options.isAndroidApp - Android App/WebView layout 후보 여부
 * @param {boolean} options.isMobileBrowser - 모바일 브라우저 layout 후보 여부
 * @param {boolean} options.isAndroidWebView - Android WebView layout 후보 여부
 * @returns {boolean} 모바일 레이아웃이면 true
 */
export function shouldUseMobileLayoutForFlags({
  isCompactViewport = false,
  isAndroidApp = false,
  isMobileBrowser = false,
  isAndroidWebView = false,
} = {}) {
  return Boolean(
    isCompactViewport || isAndroidApp || isMobileBrowser || isAndroidWebView
  );
}

/**
 * layout mode 문자열을 반환합니다.
 * @param {object} options
 * @param {boolean} options.shouldUseMobileLayout - 모바일 레이아웃 여부
 * @returns {"mobile"|"desktop"} layout mode
 */
export function resolveLayoutMode({shouldUseMobileLayout = false} = {}) {
  return shouldUseMobileLayout ? LAYOUT_MODE.MOBILE : LAYOUT_MODE.DESKTOP;
}

export function isMobileLayoutMode(layoutMode) {
  return layoutMode === LAYOUT_MODE.MOBILE;
}

export function isDesktopLayoutMode(layoutMode) {
  return layoutMode === LAYOUT_MODE.DESKTOP;
}
