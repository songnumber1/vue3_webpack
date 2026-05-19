import {
  RUN_ENV,
  PLATFORM,
  hasAndroidBridge,
  hasIosBridge,
  hasExtensionRuntime,
} from "@/core/config";
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
  if (/Edg\//i.test(ua)) return "edge";
  if (/OPR\//i.test(ua)) return "opera";
  if (/SamsungBrowser\//i.test(ua)) return "samsung-internet";
  if (/CriOS|Chrome\//i.test(ua)) return "chrome";
  if (/FxiOS|Firefox\//i.test(ua)) return "firefox";
  if (/Safari\//i.test(ua)) return "safari";

  return "unknown";
}
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
function detectEnv(ua, platform) {
  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  if (/iPhone|iPad|iPod/i.test(ua)) return PLATFORM.IOS;
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;

  return PLATFORM.UNKNOWN;
}
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
function getAppVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;

  return bridge?.appVersion || bridge?.version || "";
}
function getBridgeVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;

  return bridge?.bridgeVersion || "";
}
/**
 * @description 모바일 웹에서 음성 인식 마이크 버튼을 노출할 수 있는 브라우저인지 확인합니다.
 * @param {object} value - 플랫폼과 브라우저 판별에 필요한 값입니다.
 * @param {boolean} value.isAndroid - Android 환경 여부입니다.
 * @param {boolean} value.isMobileBrowser - 네이티브 앱이 아닌 모바일 브라우저 여부입니다.
 * @param {string} value.browserName - User-Agent로 판별한 브라우저 이름입니다.
 * @returns {boolean} Android Chrome 또는 Samsung Internet 모바일 브라우저이면 true를 반환합니다.
 */
function isSupportedMobileMicBrowser({
  isAndroid,
  isMobileBrowser,
  browserName,
}) {
  // Android 모바일 브라우저가 아니면 PC와 동일하게 전송 버튼 fallback을 사용합니다.
  if (!isAndroid || !isMobileBrowser) return false;

  // Firefox Android는 SpeechRecognition 런타임 지원이 없어 마이크 버튼 대상에서 제외합니다.
  return browserName === "chrome" || browserName === "samsung-internet";
}
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
  const isMobile = isAndroid || isIos;
  const isMobileBrowser = isMobile && !isNativeApp;
  const isMic = isSupportedMobileMicBrowser({
    isAndroid,
    isMobileBrowser,
    browserName,
  });
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
    isMobile,
    isMobileBrowser,
    isMic,
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
