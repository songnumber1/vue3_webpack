/**
 * @file android.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { RUN_ENV, PLATFORM } from "./constants";
import { createId } from "@/utils/id";

/**
 * Android 앱에서 웹 런타임이 요구하는 최소/최신 버전 정보입니다.
 *
 * - currentVersion(appInfo.appVersion)이 latestVersion보다 낮으면 업데이트 페이지로 이동합니다.
 * - Android Chrome처럼 window.AndroidBridge가 없는 경우에는 Android native config가 생성되지 않으므로 이 정책이 적용되지 않습니다.
 */
export const LAST_VERSION_INFO = Object.freeze({
  version: "1.0.0",
  title: "앱 업데이트가 필요합니다.",
  message:
    "현재 앱 버전에서는 최신 웹 기능을 사용할 수 없습니다. 앱을 업데이트한 후 다시 실행해 주세요."
});

/**
 * readAndroidValue 처리 함수입니다.
 * @param {*} bridge 함수 실행에 필요한 입력값입니다.
 * @param {*} methodName 함수 실행에 필요한 입력값입니다.
 * @param {*} fallback 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function readAndroidValue(bridge, methodName, fallback = null) {
  try {
    const member = bridge?.[methodName];
    const value = typeof member === "function" ? member.call(bridge) : member;
    return value == null || value === "" ? fallback : String(value);
  } catch {
    return fallback;
  }
}

/**
 * createAndroidConfig 함수입니다.
 * @param {*} bridge 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
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
    lastVersionInfo: LAST_VERSION_INFO
  };
}
