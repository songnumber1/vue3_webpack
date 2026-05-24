import {RUN_ENV, PLATFORM, hasAndroidBridge, hasExtensionRuntime} from "@/core/config";
import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";
import {logPlatformDebug} from "@/platform/platformDebug";
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
function isAndroidWebViewUserAgent(ua) {
  return /Android/i.test(ua) && (/; wv\)/i.test(ua) || /Version\/\d+/i.test(ua));
}

function getBrowserName(ua, hasBridge = false) {
  if (hasBridge) return "webview";
  if (/SamsungBrowser\//i.test(ua)) return "samsung";
  if (/EdgA\//i.test(ua)) return "edge";
  if (/OPR\//i.test(ua) || /Opera\//i.test(ua)) return "opera";
  if (/Firefox\//i.test(ua) || /FxiOS\//i.test(ua)) return "firefox";
  if (isAndroidWebViewUserAgent(ua)) return "android-webview";
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
function resolveBasePlatform(value, ua, navPlatform) {
  return Object.values(PLATFORM).includes(value) ? value : detectEnv(ua, navPlatform);
}

function detectDevice({env, browserName}) {
  if (hasAndroidBridge()) return "app";
  if (env === PLATFORM.ANDROID) return browserName === "chrome" ? "chrome" : "unsupported-android-browser";
  if (env === PLATFORM.WINDOWS || env === PLATFORM.MAC || env === PLATFORM.LINUX) return browserName === "unknown" ? "pc" : browserName;
  return "unknown";
}

function createActualPlatformInfo({env, runtime, device, browserName, browserVersion}) {
  return {
    env,
    runtime,
    device,
    browser: browserName,
    browserVersion,
    label: [env, device, browserName].filter(Boolean).join(" / "),
  };
}

function getForcedPlatformOverride(value) {
  return Object.values(PLATFORM_OVERRIDE_MODES).includes(value)
    ? value
    : PLATFORM_OVERRIDE_MODES.auto;
}

function resolveForcedPlatform({baseAppInfo, detected}) {
  const override = getForcedPlatformOverride(baseAppInfo.platformOverride);

  if (override === PLATFORM_OVERRIDE_MODES.androidChrome) {
    return {
      ...detected,
      env: PLATFORM.ANDROID,
      runtime: RUN_ENV.BROWSER,
      device: "chrome",
      browserName: "chrome",
      browserVersion: detected.browserVersion || "",
      isForced: true,
    };
  }

  if (override === PLATFORM_OVERRIDE_MODES.androidWebView) {
    return {
      ...detected,
      env: PLATFORM.ANDROID,
      runtime: RUN_ENV.BROWSER,
      device: "android-webview",
      browserName: "android-webview",
      browserVersion: detected.browserVersion || "",
      isForced: true,
    };
  }

  return {...detected, isForced: false};
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
  const hasBridge = hasAndroidBridge();
  const detectedBrowserName = getBrowserName(ua, hasBridge);
  const detectedBrowserVersion = getBrowserVersion(ua, detectedBrowserName);
  const detectedEnv = resolveBasePlatform(baseAppInfo.platform, ua, navPlatform);
  const detectedRuntime = hasBridge
    ? RUN_ENV.NATIVE
    : hasExtensionRuntime()
      ? RUN_ENV.EXTENSION
      : RUN_ENV.BROWSER;
  const detectedDevice = detectDevice({
    env: detectedEnv,
    browserName: detectedBrowserName,
  });
  const actualPlatform = createActualPlatformInfo({
    env: detectedEnv,
    runtime: detectedRuntime,
    device: detectedDevice,
    browserName: detectedBrowserName,
    browserVersion: detectedBrowserVersion,
  });
  const forcedPlatform = resolveForcedPlatform({
    baseAppInfo,
    detected: {
      env: detectedEnv,
      runtime: detectedRuntime,
      device: detectedDevice,
      browserName: detectedBrowserName,
      browserVersion: detectedBrowserVersion,
    },
  });
  const browserName = forcedPlatform.browserName;
  const browserVersion = forcedPlatform.browserVersion;
  const env = forcedPlatform.env;
  const runtime = forcedPlatform.runtime;
  const device = forcedPlatform.device;
  const isAndroid = env === PLATFORM.ANDROID;
  const isWindows = env === PLATFORM.WINDOWS;
  const isNativeApp = runtime === RUN_ENV.NATIVE;
  const isAndroidApp = isAndroid && hasBridge;
  const isMobile = isAndroid;
  const isMobileBrowser = isMobile && !isNativeApp;
  const isUnsupportedBrowser =
    isMobileBrowser && browserName !== "chrome" && !forcedPlatform.isForced;
  const unsupportedReason = isUnsupportedBrowser ? "unsupported-android-browser" : "";
  const isAccess = !isUnsupportedBrowser;
  const width = typeof window === "undefined" ? 0 : window.innerWidth;
  const height = typeof window === "undefined" ? 0 : window.innerHeight;
  const visualWidth = typeof window === "undefined" ? 0 : Math.round(window.visualViewport?.width || 0);
  const compactWidthCandidates = [visualWidth, width].filter((value) => Number.isFinite(value) && value > 0);
  const compactWidth = compactWidthCandidates.length ? Math.min(...compactWidthCandidates) : 0;
  const isCompactViewport = compactWidth > 0 && compactWidth <= MOBILE_BREAKPOINT_PX;
  const isMic = isSupportedMobileMicBrowser({isAndroid, isMobileBrowser, browserName});

  logPlatformDebug("platform.resolve", {
    platformOverride: getForcedPlatformOverride(baseAppInfo.platformOverride),
    isPlatformForced: forcedPlatform.isForced,
    actualPlatform: actualPlatform.label,
    resolved: {env, runtime, device, browser: browserName, isAndroid, isMobile, isMobileBrowser, isAndroidApp, isCompactViewport},
    viewport: {width, height, visualWidth, compactWidth},
  });

  return {
    env,
    runtime,
    device,
    browser: browserName,
    browserVersion,
    userAgent: ua,
    platform: navPlatform,
    actualPlatform,
    actualEnv: actualPlatform.env,
    actualRuntime: actualPlatform.runtime,
    actualDevice: actualPlatform.device,
    actualBrowser: actualPlatform.browser,
    actualBrowserVersion: actualPlatform.browserVersion,
    actualPlatformLabel: actualPlatform.label,
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
    isPlatformForced: forcedPlatform.isForced,
    platformOverride: getForcedPlatformOverride(baseAppInfo.platformOverride),
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
