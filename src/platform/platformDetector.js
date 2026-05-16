/**
 * @file platformDetector.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {
  RUN_ENV,
  PLATFORM,
  hasAndroidBridge,
  hasIosBridge,
  hasExtensionRuntime,
} from "@/core/config";

/**
 * getNavigator 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getNavigator() {
  return typeof window === "undefined" ? {} : window.navigator || {};
}
/**
 * getScreen 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getScreen() {
  return typeof window === "undefined" ? {} : window.screen || {};
}
/**
 * parseVersion 처리 함수입니다.
 * @param {*} ua 함수 실행에 필요한 입력값입니다.
 * @param {*} pattern 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function parseVersion(ua, pattern) {
  const match = ua.match(pattern);
  return match?.[1] || "";
}
/**
 * getBrowserName 처리 함수입니다.
 * @param {*} ua 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getBrowserName(ua) {
  if (/Edg\//i.test(ua)) return "edge";
  if (/OPR\//i.test(ua)) return "opera";
  if (/SamsungBrowser\//i.test(ua)) return "samsung-internet";
  if (/CriOS|Chrome\//i.test(ua)) return "chrome";
  if (/FxiOS|Firefox\//i.test(ua)) return "firefox";
  if (/Safari\//i.test(ua)) return "safari";
  return "unknown";
}
/**
 * getBrowserVersion 처리 함수입니다.
 * @param {*} ua 함수 실행에 필요한 입력값입니다.
 * @param {*} browserName 함수 실행에 필요한 입력값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getBrowserVersion(ua, browserName) {
  if (browserName === "edge") return parseVersion(ua, /Edg\/([\d.]+)/i);
  if (browserName === "chrome")
    return parseVersion(ua, /(?:Chrome|CriOS)\/([\d.]+)/i);
  if (browserName === "safari") return parseVersion(ua, /Version\/([\d.]+)/i);
  if (browserName === "firefox")
    return parseVersion(ua, /(?:Firefox|FxiOS)\/([\d.]+)/i);
  if (browserName === "samsung-internet")
    return parseVersion(ua, /SamsungBrowser\/([\d.]+)/i);
  return "";
}
/**
 * detectEnv 처리 함수입니다.
 * @param {*} ua 함수 실행에 필요한 입력값입니다.
 * @param {*} platform 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function detectEnv(ua, platform) {
  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  if (/iPhone|iPad|iPod/i.test(ua)) return PLATFORM.IOS;
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;
  return PLATFORM.UNKNOWN;
}
/**
 * detectDevice 처리 함수입니다.
 * @param {*} options 함수 실행에 필요한 입력값입니다.
 * @param {*} env 함수 실행에 필요한 입력값입니다.
 * @param {*} browserName 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function detectDevice({env, browserName}) {
  if (hasAndroidBridge() || hasIosBridge()) return "app";
  if (
    env === PLATFORM.WINDOWS ||
    env === PLATFORM.MAC ||
    env === PLATFORM.LINUX
  )
    return browserName === "unknown" ? "pc" : browserName;
  if (env === PLATFORM.ANDROID) return browserName || "android-browser";
  if (env === PLATFORM.IOS) return browserName || "ios-browser";
  return "unknown";
}
/**
 * getAppVersionFromBridge 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getAppVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  return bridge?.appVersion || bridge?.version || "";
}
/**
 * getBridgeVersionFromBridge 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getBridgeVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  return bridge?.bridgeVersion || "";
}
/**
 * resolveDetailedPlatform 함수입니다.
 * @param {*} baseAppInfo 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function resolveDetailedPlatform(baseAppInfo = {}) {
  const nav = getNavigator();
  const screen = getScreen();
  const ua = nav.userAgent || "";
  const navPlatform = nav.platform || "";
  const browserName = getBrowserName(ua);
  const browserVersion = getBrowserVersion(ua, browserName);
  const env = baseAppInfo.platform || detectEnv(ua, navPlatform);
  const runtime =
    hasAndroidBridge() || hasIosBridge()
      ? RUN_ENV.NATIVE
      : hasExtensionRuntime()
        ? RUN_ENV.EXTENSION
        : RUN_ENV.BROWSER;
  const device = detectDevice({ua, env, browserName});
  const isAndroid = env === PLATFORM.ANDROID;
  const isIos = env === PLATFORM.IOS;
  const isWindows = env === PLATFORM.WINDOWS;
  const isNativeApp = runtime === RUN_ENV.NATIVE;
  const isAndroidApp = isAndroid && hasAndroidBridge();
  const isIosApp = isIos && hasIosBridge();
  const isMobileBrowser = (isAndroid || isIos) && !isNativeApp;
  const isAccess = !isIos; // 현재 정책상 iOS 접근은 차단한다.
  const width = typeof window === "undefined" ? 0 : window.innerWidth;
  const height = typeof window === "undefined" ? 0 : window.innerHeight;
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
    isWindows,
    isAndroid,
    isIos,
    isNativeApp,
    isAndroidApp,
    isIosApp,
    isMobileBrowser,
    isChrome: browserName === "chrome",
    isSafari: browserName === "safari",
    isPc: isWindows || env === PLATFORM.MAC || env === PLATFORM.LINUX,
    appVersion: getAppVersionFromBridge() || baseAppInfo.appVersion || "1.0.0",
    appBuildVersion: baseAppInfo.appBuildVersion || "",
    bridgeVersion:
      getBridgeVersionFromBridge() || baseAppInfo.bridgeVersion || "",
    deviceId: baseAppInfo.deviceId || null,
    token: baseAppInfo.token || "",
    screen: {
      width: screen.width || 0,
      height: screen.height || 0,
      pixelRatio:
        typeof window === "undefined" ? 1 : window.devicePixelRatio || 1,
    },
    viewport: {width, height},
    updatedAt: new Date().toISOString(),
  };
}
