import {PLATFORM, hasAndroidBridge} from "@/core/config";

export function getNavigator() {
  return typeof window === "undefined" ? {} : window.navigator || {};
}

export function getScreen() {
  return typeof window === "undefined" ? {} : window.screen || {};
}

function parseVersion(ua, pattern) {
  const match = ua.match(pattern);
  return match?.[1] || "";
}

function isAndroidWebViewUserAgent(ua) {
  return (
    /Android/i.test(ua) && (/; wv\)/i.test(ua) || /Version\/\d+/i.test(ua))
  );
}

export function getBrowserName(ua, hasBridge = false) {
  if (hasBridge) return "webview";
  if (/SamsungBrowser\//i.test(ua)) return "samsung";
  if (/EdgA\//i.test(ua)) return "edge";
  if (/OPR\//i.test(ua) || /Opera\//i.test(ua)) return "opera";
  if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) return "firefox";
  if (isAndroidWebViewUserAgent(ua)) return "android-webview";
  if (/Chrome\//i.test(ua)) return "chrome";
  return "unknown";
}

export function getBrowserVersion(ua, browserName) {
  if (browserName === "chrome") return parseVersion(ua, /Chrome\/([\d.]+)/i);
  return "";
}

export function detectEnv(ua, platform) {
  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;
  return PLATFORM.UNKNOWN;
}

export function resolveBasePlatform(value, ua, navPlatform) {
  return Object.values(PLATFORM).includes(value)
    ? value
    : detectEnv(ua, navPlatform);
}

export function detectDevice({env, browserName}) {
  if (hasAndroidBridge()) return "app";
  if (env === PLATFORM.ANDROID) {
    return browserName === "chrome" ? "chrome" : "unsupported-android-browser";
  }
  if (
    env === PLATFORM.WINDOWS ||
    env === PLATFORM.MAC ||
    env === PLATFORM.LINUX
  ) {
    return browserName === "unknown" ? "pc" : browserName;
  }
  return "unknown";
}

export function createActualPlatformInfo({
  env,
  runtime,
  device,
  browserName,
  browserVersion,
}) {
  return {
    env,
    runtime,
    device,
    browser: browserName,
    browserVersion,
    label: [env, device, browserName].filter(Boolean).join(" / "),
  };
}

export function getAppVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  return bridge?.appVersion || bridge?.version || "";
}

export function getBridgeVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  return bridge?.bridgeVersion || "";
}

export function isSupportedMobileMicBrowser({
  isAndroid,
  isMobileBrowser,
  browserName,
}) {
  if (!isAndroid || !isMobileBrowser) return false;
  return browserName === "chrome";
}
