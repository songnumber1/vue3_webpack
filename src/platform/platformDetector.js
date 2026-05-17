import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  RUN_ENV,
  PLATFORM,
  hasAndroidBridge,
  hasIosBridge,
  hasExtensionRuntime,
} from "@/core/config";

/**
 * @description getNavigator 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getNavigator() {
  // 계산된 결과를 호출부로 반환합니다.
  return typeof window === "undefined" ? {} : window.navigator || {};
}
/**
 * @description getScreen 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getScreen() {
  // 계산된 결과를 호출부로 반환합니다.
  return typeof window === "undefined" ? {} : window.screen || {};
}
/**
 * @description parseVersion 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} ua - ua 입력값입니다.
 * @param {*} pattern - pattern 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function parseVersion(ua, pattern) {
  const match = ua.match(pattern);
  // 계산된 결과를 호출부로 반환합니다.
  return match?.[1] || "";
}
/**
 * @description getBrowserName 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} ua - ua 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getBrowserName(ua) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Edg\//i.test(ua)) return "edge";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/OPR\//i.test(ua)) return "opera";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/SamsungBrowser\//i.test(ua)) return "samsung-internet";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/CriOS|Chrome\//i.test(ua)) return "chrome";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/FxiOS|Firefox\//i.test(ua)) return "firefox";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Safari\//i.test(ua)) return "safari";
  // 계산된 결과를 호출부로 반환합니다.
  return "unknown";
}
/**
 * @description getBrowserVersion 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} ua - ua 입력값입니다.
 * @param {*} browserName - browserName 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getBrowserVersion(ua, browserName) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (browserName === "edge") return parseVersion(ua, /Edg\/([\d.]+)/i);
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (browserName === "chrome")
    // 계산된 결과를 호출부로 반환합니다.
    return parseVersion(ua, /(?:Chrome|CriOS)\/([\d.]+)/i);
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (browserName === "safari") return parseVersion(ua, /Version\/([\d.]+)/i);
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (browserName === "firefox")
    // 계산된 결과를 호출부로 반환합니다.
    return parseVersion(ua, /(?:Firefox|FxiOS)\/([\d.]+)/i);
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (browserName === "samsung-internet")
    // 계산된 결과를 호출부로 반환합니다.
    return parseVersion(ua, /SamsungBrowser\/([\d.]+)/i);
  // 계산된 결과를 호출부로 반환합니다.
  return "";
}
/**
 * @description detectEnv 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} ua - ua 입력값입니다.
 * @param {*} platform - platform 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function detectEnv(ua, platform) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/iPhone|iPad|iPod/i.test(ua)) return PLATFORM.IOS;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;
  // 계산된 결과를 호출부로 반환합니다.
  return PLATFORM.UNKNOWN;
}
/**
 * @description detectDevice 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function detectDevice({env, browserName}) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (hasAndroidBridge() || hasIosBridge()) return "app";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (
    env === PLATFORM.WINDOWS ||
    env === PLATFORM.MAC ||
    env === PLATFORM.LINUX
  )
    // 계산된 결과를 호출부로 반환합니다.
    return browserName === "unknown" ? "pc" : browserName;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (env === PLATFORM.ANDROID) return browserName || "android-browser";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (env === PLATFORM.IOS) return browserName || "ios-browser";
  // 계산된 결과를 호출부로 반환합니다.
  return "unknown";
}
/**
 * @description getAppVersionFromBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getAppVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  // 계산된 결과를 호출부로 반환합니다.
  return bridge?.appVersion || bridge?.version || "";
}
/**
 * @description getBridgeVersionFromBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getBridgeVersionFromBridge() {
  const bridge = typeof window === "undefined" ? null : window.AndroidBridge;
  // 계산된 결과를 호출부로 반환합니다.
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

/**
 * @description resolveDetailedPlatform 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} baseAppInfo - baseAppInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
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
  // 계산된 결과를 호출부로 반환합니다.
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
