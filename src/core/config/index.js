import {RUN_ENV, PLATFORM} from "./constants";
import {createDefaultConfig} from "./default";
import {createAndroidConfig} from "./android";
import {createIosConfig} from "./ios";
import {createExtensionConfig} from "./extension";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description getNavigator 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getNavigator() {
  // 계산된 결과를 호출부로 반환합니다.
  return typeof window === "undefined" ? null : window.navigator;
}

/**
 * @description hasAndroidBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function hasAndroidBridge() {
  // 계산된 결과를 호출부로 반환합니다.
  return typeof window !== "undefined" && Boolean(window.AndroidBridge);
}

/**
 * @description hasIosBridge 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function hasIosBridge() {
  // 계산된 결과를 호출부로 반환합니다.
  return (
    typeof window !== "undefined" &&
    Boolean(window.webkit?.messageHandlers?.AppBridge)
  );
}

/**
 * @description hasExtensionRuntime 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function hasExtensionRuntime() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined") return false;
  // 계산된 결과를 호출부로 반환합니다.
  return Boolean(window.chrome?.runtime?.id || window.browser?.runtime?.id);
}

/**
 * @description detectBrowserPlatform 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function detectBrowserPlatform() {
  const nav = getNavigator();
  const ua = nav?.userAgent || "";
  const platform = nav?.platform || "";

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/iPhone|iPad|iPod/i.test(ua)) return PLATFORM.IOS;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;

  // 계산된 결과를 호출부로 반환합니다.
  return PLATFORM.UNKNOWN;
}

/**
 * @description resolveAppConfig 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveAppConfig() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (hasAndroidBridge()) return createAndroidConfig(window.AndroidBridge);
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (hasIosBridge()) return createIosConfig();
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (hasExtensionRuntime())
    // 계산된 결과를 호출부로 반환합니다.
    return createExtensionConfig(detectBrowserPlatform());

  // 계산된 결과를 호출부로 반환합니다.
  return createDefaultConfig(detectBrowserPlatform());
}

/**
 * @description isNativeApp 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isNativeApp(appInfo) {
  // 계산된 결과를 호출부로 반환합니다.
  return appInfo?.env === RUN_ENV.NATIVE;
}

/**
 * @description isBrowserApp 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isBrowserApp(appInfo) {
  // 계산된 결과를 호출부로 반환합니다.
  return appInfo?.env === RUN_ENV.BROWSER;
}

/**
 * @description isExtensionApp 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isExtensionApp(appInfo) {
  // 계산된 결과를 호출부로 반환합니다.
  return appInfo?.env === RUN_ENV.EXTENSION;
}

/**
 * @description isAndroidApp 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isAndroidApp(appInfo) {
  // 계산된 결과를 호출부로 반환합니다.
  return isNativeApp(appInfo) && appInfo?.platform === PLATFORM.ANDROID;
}

/**
 * @description isIosApp 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isIosApp(appInfo) {
  // 계산된 결과를 호출부로 반환합니다.
  return isNativeApp(appInfo) && appInfo?.platform === PLATFORM.IOS;
}

export {RUN_ENV, PLATFORM};
