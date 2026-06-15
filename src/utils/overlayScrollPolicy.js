/**
 * @file utils/overlayScrollPolicy.js
 * @description OverlayScrollbars 런타임 판별에 사용하는 순수 정책 헬퍼입니다.
 */

/**
 * 실제 Android Chrome/WebView/App 런타임인지 판별합니다.
 * 플랫폼 강제 설정이 아닌 실제 런타임 기준으로 OverlayScroll 기본 정책을 유지합니다.
 * @param {object} info - platformStore.info 또는 동일한 플랫폼 메타 정보 객체
 * @returns {boolean} 실제 Android 계열 런타임이면 true
 */
export function isActualAndroidOverlayRuntime(info = {}) {
  const userAgent = String(info.userAgent || "");

  return Boolean(
    info.actualEnv === "android" ||
    info.actualDevice === "android" ||
    info.actualDevice === "android-webview" ||
    info.actualBrowser === "android-webview" ||
    info.isAndroidApp ||
    /Android/i.test(userAgent)
  );
}

export const OVERLAY_SCROLL_MODE = Object.freeze({
  PC_ONLY: "pc-only",
  ALL: "all",
  OFF: "off",
});

export function normalizeOverlayScrollMode(mode) {
  const value = String(mode || "").trim();
  return Object.values(OVERLAY_SCROLL_MODE).includes(value)
    ? value
    : OVERLAY_SCROLL_MODE.PC_ONLY;
}

/**
 * 런타임 정보와 모드 기준으로 OverlayScrollbars 사용 여부를 계산합니다.
 * Vue 의존성이 없는 순수 함수라 util fallback과 composable이 같은 기준을 공유합니다.
 * @param {object} info - 실제 런타임 메타 정보
 * @param {string} mode - pc-only/all/off
 * @returns {boolean} OverlayScrollbars를 사용할 수 있으면 true
 */
export function shouldUseOverlayScrollbarForRuntime(
  info = {},
  mode = OVERLAY_SCROLL_MODE.PC_ONLY
) {
  const normalizedMode = normalizeOverlayScrollMode(mode);
  if (normalizedMode === OVERLAY_SCROLL_MODE.OFF) return false;
  if (normalizedMode === OVERLAY_SCROLL_MODE.ALL) return true;
  return !isActualAndroidOverlayRuntime(info);
}
