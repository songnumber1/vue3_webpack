import {RUN_ENV, PLATFORM, hasAndroidBridge, hasExtensionRuntime} from "@/core/config";
import {MOBILE_BREAKPOINT_PX} from "@/platform/viewport/viewportConstants";

function getNavigator() {
  return typeof window === "undefined" ? {} : window.navigator || {};
}
function getScreen() {
  return typeof window === "undefined" ? {} : window.screen || {};
}
function parseVersion(ua, pattern) {
  const match = ua.match(pattern);
  return match?.[1] || "";
}
function getBrowserName(ua) {
  if (/Chrome\//i.test(ua)) return "chrome";
  return "unknown";
}
function getBrowserVersion(ua, browserName) {
  if (browserName === "chrome") return parseVersion(ua, /Chrome\/([\d.]+)/i);
  return "";
}
function detectEnv(ua, platform) {
  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;
  return PLATFORM.UNKNOWN;
}
function detectDevice({env, browserName}) {
  if (hasAndroidBridge()) return "app";
  if (env === PLATFORM.ANDROID) return browserName === "chrome" ? "chrome" : "unsupported-android-browser";
  if (env === PLATFORM.WINDOWS || env === PLATFORM.MAC || env === PLATFORM.LINUX) return browserName === "unknown" ? "pc" : browserName;
  return "unknown";
}
function getAppVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  return bridge?.appVersion || bridge?.version || "";
}
function getBridgeVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  return bridge?.bridgeVersion || "";
}
function isSupportedMobileMicBrowser({isAndroid, isMobileBrowser, browserName}) {
  if (!isAndroid || !isMobileBrowser) return false;
  return browserName === "chrome";
}
export function resolveDetailedPlatform(baseAppInfo = {}) {
  const nav = getNavigator();
  const screen = getScreen();
  const ua = nav.userAgent || "";
  const navPlatform = nav.platform || "";
  const browserName = getBrowserName(ua);
  const browserVersion = getBrowserVersion(ua, browserName);
  const env = baseAppInfo.platform || detectEnv(ua, navPlatform);
  const runtime = hasAndroidBridge()
    ? RUN_ENV.NATIVE
    : hasExtensionRuntime()
      ? RUN_ENV.EXTENSION
      : RUN_ENV.BROWSER;
  const device = detectDevice({env, browserName});
  const isAndroid = env === PLATFORM.ANDROID;
  const isWindows = env === PLATFORM.WINDOWS;
  const isNativeApp = runtime === RUN_ENV.NATIVE;
  const isAndroidApp = isAndroid && hasAndroidBridge();
  const isMobile = isAndroid;
  const isMobileBrowser = isMobile && !isNativeApp;
  const isUnsupportedBrowser = isMobileBrowser && browserName !== "chrome";
  const unsupportedReason = isUnsupportedBrowser ? "unsupported-android-browser" : "";
  const isAccess = !isUnsupportedBrowser;
  const width = typeof window === "undefined" ? 0 : window.innerWidth;
  const height = typeof window === "undefined" ? 0 : window.innerHeight;
  const visualWidth = typeof window === "undefined" ? 0 : Math.round(window.visualViewport?.width || 0);
  const compactWidthCandidates = [visualWidth, width].filter((value) => Number.isFinite(value) && value > 0);
  const compactWidth = compactWidthCandidates.length ? Math.min(...compactWidthCandidates) : 0;
  const isCompactViewport = compactWidth > 0 && compactWidth <= MOBILE_BREAKPOINT_PX;
  const isMic = isSupportedMobileMicBrowser({isAndroid, isMobileBrowser, browserName});

  return {
    env,
    runtime,
    device,
    browser: browserName,
    browserVersion,
    userAgent: ua,
    platform: navPlatform,
    language: nav.language || "",
    languages: Array.from(nav.languages || []),
    isAccess,
    unsupportedReason,
    isWindows,
    isAndroid,
    isNativeApp,
    isNativeRuntime: isNativeApp,
    isCompactViewport,
    isAndroidApp,
    isMobile,
    isMobileBrowser,
    isMic,
    isChrome: browserName === "chrome",
    isPc: isWindows || env === PLATFORM.MAC || env === PLATFORM.LINUX,
    appVersion: getAppVersionFromBridge() || baseAppInfo.appVersion || "1.0.0",
    appBuildVersion: baseAppInfo.appBuildVersion || "",
    bridgeVersion: getBridgeVersionFromBridge() || baseAppInfo.bridgeVersion || "",
    deviceId: baseAppInfo.deviceId || null,
    token: baseAppInfo.token || "",
    screen: {
      width: screen.width || 0,
      height: screen.height || 0,
      pixelRatio: typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    },
    viewport: {width, height},
    updatedAt: new Date().toISOString(),
  };
}
