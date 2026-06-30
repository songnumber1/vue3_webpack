import {resolveStreamRuntimeType} from "@/platform/runtime/runtimeDetector";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";

export const SESSION_AUTH_URLS = Object.freeze({
  loginUrl: "/login.do",
  tempLoginUrl: "/temp-login.do",
  accessInfoUrl: "/access/info.do",
  logoutUrl: "/logout.do",
});

export const AUTH_CLIENT_PLATFORM_HEADER = "X-Client-Platform";

export function resolveClientPlatform() {
  const runtimeType = resolveStreamRuntimeType();
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW)
    return "android-webview";
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME) return "mobile-web";
  return "mobile-web";
}

export function resolveSessionAuthConfig() {
  return {
    platform: resolveClientPlatform(),
    withCredentials: true,
    ...SESSION_AUTH_URLS,
  };
}

export function isAuthPublicUrl(url = "") {
  const value = String(url || "");
  return [
    SESSION_AUTH_URLS.loginUrl,
    SESSION_AUTH_URLS.tempLoginUrl,
    SESSION_AUTH_URLS.logoutUrl,
  ].some((path) => value.includes(path));
}
