/**
 * @file platform/bridge/bridgeConstants.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const WEB_API_PATH = "/web-api/";
export const JS_TO_ANDROID_PATH = "/bridge/js-to-android/";
export const ANDROID_TO_JS_PATH = "/bridge/android-to-js/";
export const BRIDGE_TIMEOUT = 5000;

export const BRIDGE_CATEGORY = {
  ALL: "all",
  WEB_API: "web-api",
  JS_TO_ANDROID: "js-to-android",
  ANDROID_TO_JS: "android-to-js",
};
