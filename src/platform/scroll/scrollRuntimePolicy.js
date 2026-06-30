/**
 * @file platform/scroll/scrollRuntimePolicy.js
 * @description 모바일 전용 OverlayScrollbars 정책입니다.
 */

export const OVERLAY_SCROLL_MODE = Object.freeze({
  ALL: "all",
});

export const DEFAULT_OVERLAY_SCROLL_MODE = OVERLAY_SCROLL_MODE.ALL;

export function normalizeOverlayScrollMode() {
  return DEFAULT_OVERLAY_SCROLL_MODE;
}

export function isActualAndroidOverlayRuntime(info = {}) {
  return Boolean(
    info.isAndroid ||
      info.isAndroidApp ||
      info.isAndroidWebView ||
      info.actualEnv === "android" ||
      /Android/i.test(String(info.userAgent || ""))
  );
}

export function isActualAndroidChromeRuntimeInfo(info = {}) {
  return isActualAndroidOverlayRuntime(info) && info.browser === "chrome";
}

export function isActualAndroidWebViewRuntimeInfo(info = {}) {
  return isActualAndroidOverlayRuntime(info) && Boolean(info.isAndroidWebView);
}


export function resolveActualRuntimeMode(info = {}) {
  if (isActualAndroidWebViewRuntimeInfo(info)) return "android-webview";
  if (isActualAndroidChromeRuntimeInfo(info)) return "android-chrome";
  return "mobile";
}

export function shouldUseOverlayScrollbarForRuntime() {
  return true;
}
