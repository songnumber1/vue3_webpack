/**
 * @file core/config/index.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {RUN_ENV, PLATFORM} from "./constants";
import {createDefaultConfig} from "./default";
import {createAndroidConfig} from "./android";
import {createExtensionConfig} from "./extension";

/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
 */
function getNavigator() {
  return typeof window === "undefined" ? null : window.navigator;
}
export function hasAndroidBridge() {
  return typeof window !== "undefined" && Boolean(window.AndroidBridge);
}
export function hasExtensionRuntime() {
  if (typeof window === "undefined") return false;
  return Boolean(window.chrome?.runtime?.id || window.browser?.runtime?.id);
}
export function detectBrowserPlatform() {
  const nav = getNavigator();
  const ua = nav?.userAgent || "";
  const platform = nav?.platform || "";

  if (/Android/i.test(ua)) return PLATFORM.ANDROID;
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;
  return PLATFORM.UNKNOWN;
}
export function resolveAppConfig() {
  if (hasAndroidBridge()) return createAndroidConfig(window.AndroidBridge);
  if (hasExtensionRuntime()) return createExtensionConfig(detectBrowserPlatform());
  return createDefaultConfig(detectBrowserPlatform());
}
export function isNativeApp(appInfo) {
  return appInfo?.env === RUN_ENV.NATIVE;
}
export function isAndroidApp(appInfo) {
  return isNativeApp(appInfo) && appInfo?.platform === PLATFORM.ANDROID;
}
export {RUN_ENV, PLATFORM};
