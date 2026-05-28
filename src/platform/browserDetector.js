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

function isChromeUserAgent(ua) {
  return /Chrome\//i.test(ua) || /Chromium\//i.test(ua);
}

export function getBrowserName(ua, hasBridge = false) {
  if (hasBridge) return "android-webview";
  if (isAndroidWebViewUserAgent(ua)) return "android-webview";
  if (isChromeUserAgent(ua)) return "chrome";
  return "unsupported";
}

export function getBrowserVersion(ua, browserName) {
  if (browserName === "chrome") {
    return parseVersion(ua, /(?:Chrome|Chromium)\/([\d.]+)/i);
  }
  if (browserName === "android-webview") {
    return (
      parseVersion(ua, /(?:Chrome|Chromium)\/([\d.]+)/i) ||
      parseVersion(ua, /Version\/([\d.]+)/i)
    );
  }
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

export function isSupportedBrowserName(browserName) {
  return browserName === "chrome" || browserName === "android-webview";
}

export function detectDevice({env, browserName}) {
  if (hasAndroidBridge()) return "android-webview";
  if (env === PLATFORM.ANDROID) {
    return isSupportedBrowserName(browserName)
      ? browserName
      : "unsupported-browser";
  }
  if (
    env === PLATFORM.WINDOWS ||
    env === PLATFORM.MAC ||
    env === PLATFORM.LINUX
  ) {
    return browserName === "chrome" ? "chrome" : "unsupported-browser";
  }
  return "unsupported-browser";
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
