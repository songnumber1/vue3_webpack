import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {AUTH_MODES} from "@/auth/authConstants";
import {resolveStreamRuntimeType} from "@/platform/runtime/runtimeDetector";
import {STREAM_RUNTIME_TYPES} from "@/platform/runtime/runtimeTypes";

function normalizeMode(value, fallback) {
  return value === AUTH_MODES.JWT || value === AUTH_MODES.SESSION ? value : fallback;
}

function readSettings() {
  try {
    return useSystemSettingsStore().settings || {};
  } catch (_error) {
    return {};
  }
}

export function resolveClientPlatform() {
  const runtimeType = resolveStreamRuntimeType();
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_WEBVIEW) return "android-webview";
  if (runtimeType === STREAM_RUNTIME_TYPES.ANDROID_CHROME) return "mobile-web";
  return "web";
}

export function resolveAuthPolicy() {
  const settings = readSettings();
  const platform = resolveClientPlatform();
  const mobileLike = platform !== "web";
  const authMode = normalizeMode(
    mobileLike ? settings.mobileAuthMode : settings.webAuthMode,
    mobileLike ? AUTH_MODES.JWT : AUTH_MODES.SESSION
  );
  const jwt = authMode === AUTH_MODES.JWT;

  return {
    platform,
    authMode,
    isJwt: jwt,
    isSession: !jwt,
    withCredentials: jwt ? Boolean(settings.jwtWithCredentials) : true,
    loginUrl: mobileLike ? settings.mobileLoginUrl : settings.webLoginUrl,
    tempLoginUrl: settings.tempLoginUrl || "/temp-login.do",
    accessInfoUrl: settings.accessInfoUrl || "/access/info.do",
    logoutUrl: settings.logoutUrl || "/logout.do",
    refreshUrl: settings.jwtRefreshUrl || "/auth/refresh.do",
  };
}

export function isAuthRefreshUrl(url = "") {
  return String(url).includes("/auth/refresh.do");
}

export function isAuthPublicUrl(url = "") {
  const value = String(url || "");
  return ["/temp-login.do", "/logout.do", "/auth/refresh.do"].some((path) => value.includes(path));
}
