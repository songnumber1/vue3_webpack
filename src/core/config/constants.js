/**
 * @file core/config/constants.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const RUN_ENV = Object.freeze({
  BROWSER: "browser",
  NATIVE: "native",
  EXTENSION: "extension",
});

export const PLATFORM = Object.freeze({
  WINDOWS: "windows",
  MAC: "mac",
  LINUX: "linux",
  ANDROID: "android",
  UNKNOWN: "unknown",
});
