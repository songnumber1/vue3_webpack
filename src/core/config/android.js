import {RUN_ENV, PLATFORM} from "./constants";
import {createId} from "@/utils/id";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const LAST_VERSION_INFO = Object.freeze({
  version: "1.0.0",
  title: "앱 업데이트가 필요합니다.",
  message:
    "현재 앱 버전에서는 최신 웹 기능을 사용할 수 없습니다. 앱을 업데이트한 후 다시 실행해 주세요.",
});

/**
 * @description readAndroidValue 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} bridge - bridge 입력값입니다.
 * @param {*} methodName - methodName 입력값입니다.
 * @param {*} fallback - fallback 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function readAndroidValue(bridge, methodName, fallback = null) {
  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    const member = bridge?.[methodName];
    const value = typeof member === "function" ? member.call(bridge) : member;

    return value == null || value === "" ? fallback : String(value);
  } catch {
    return fallback;
  }
}

/**
 * @description createAndroidConfig 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} bridge - bridge 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function createAndroidConfig(bridge = window.AndroidBridge) {
  return {
    env: RUN_ENV.NATIVE,
    platform: PLATFORM.ANDROID,
    appVersion: readAndroidValue(bridge, "getAppVersionName", "1.0.0"),
    appBuildVersion: readAndroidValue(bridge, "getAppBuildVersion", "1"),
    bridgeVersion: readAndroidValue(bridge, "getBridgeVersion", "1.0.0"),
    token: readAndroidValue(bridge, "getToken", createId("app")),
    deviceId: readAndroidValue(bridge, "getDeviceId", null),
    lastVersionInfo: LAST_VERSION_INFO,
  };
}
