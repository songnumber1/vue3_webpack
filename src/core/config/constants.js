/**
 * @file core/config/constants.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
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
