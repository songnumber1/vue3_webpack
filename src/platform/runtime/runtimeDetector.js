import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";

/**
 * userAgent 문자열을 확인합니다.
 * @returns userAgent 문자열
 */
function getUserAgent() {
  if (typeof window === "undefined") return "";
  return String(window.navigator?.userAgent || "");
}

/**
 * 안드로이드 웹뷰 Bridge를 확인합니다.
 * @returns 안드로이드 웹뷰 Bridge 존재 여부 확인
 */
export function hasAndroidWebViewBridge() {
  return typeof window !== "undefined" && Boolean(window.AndroidBridge);
}

/**
 * 안드로이드 UserAgent을 확인합니다.
 * @returns 안드로이드이면서 크롬일 경우 true, 아닐 경우 false
 */
export function isAndroidChromeUserAgent() {
  const ua = getUserAgent();

  // 지원 모바일 웹 브라우저는 Android Chrome만 대상으로 둔다.
  // Samsung/Firefox/Edge/Opera/Bridge 없는 Android WebView는 모바일 브라우저 지원 대상이 아니다.
  if (!/Android/i.test(ua) || !/Chrome\//i.test(ua)) return false;
  if (/SamsungBrowser\//i.test(ua)) return false;
  if (/EdgA\//i.test(ua) || /OPR\//i.test(ua) || /Opera\//i.test(ua)) {
    return false;
  }
  if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) return false;
  if (/; wv\)/i.test(ua) || /Version\/\d+/i.test(ua)) return false;

  return true;
}

/**
 *
 */
export function resolveStreamRuntimeType() {
  if (hasAndroidWebViewBridge()) return STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW;
  if (isAndroidChromeUserAgent()) return STREAM_RUNTIME_TYPES.ANDROID_CHROME;
  return STREAM_RUNTIME_TYPES.DESKTOP_BROWSER;
}

export function isAndroidChromeRuntime(
  runtimeType = resolveStreamRuntimeType()
) {
  return runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME;
}

export function isAndroidWebViewRuntime(
  runtimeType = resolveStreamRuntimeType()
) {
  return runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW;
}

export function isDesktopBrowserRuntime(
  runtimeType = resolveStreamRuntimeType()
) {
  return runtimeType === STREAM_RUNTIME_TYPES.DESKTOP_BROWSER;
}
