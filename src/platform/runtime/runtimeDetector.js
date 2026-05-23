import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";

function getUserAgent() {
  if (typeof window === "undefined") return "";
  return String(window.navigator?.userAgent || "");
}

export function hasAndroidWebViewBridge() {
  return typeof window !== "undefined" && Boolean(window.AndroidBridge);
}

export function isAndroidChromeUserAgent() {
  const ua = getUserAgent();

  // 지원 모바일 웹 브라우저는 Android Chrome만 대상으로 둔다.
  // Android WebView는 window.AndroidBridge가 있는 경우에만 앱 런타임으로 분기한다.
  return /Android/i.test(ua) && /Chrome\//i.test(ua);
}

export function resolveStreamRuntimeType() {
  if (hasAndroidWebViewBridge()) return STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW;
  if (isAndroidChromeUserAgent()) return STREAM_RUNTIME_TYPES.ANDROID_CHROME;
  return STREAM_RUNTIME_TYPES.DESKTOP_BROWSER;
}

export function isAndroidChromeRuntime(runtimeType = resolveStreamRuntimeType()) {
  return runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME;
}

export function isAndroidWebViewRuntime(runtimeType = resolveStreamRuntimeType()) {
  return runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW;
}

export function isDesktopBrowserRuntime(runtimeType = resolveStreamRuntimeType()) {
  return runtimeType === STREAM_RUNTIME_TYPES.DESKTOP_BROWSER;
}
