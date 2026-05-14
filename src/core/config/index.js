/**
 * @file index.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {RUN_ENV, PLATFORM} from "./constants";
import {createDefaultConfig} from "./default";
import {createAndroidConfig} from "./android";
import {createIosConfig} from "./ios";
import {createExtensionConfig} from "./extension";

/**
 * getNavigator 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getNavigator() {
  return typeof window === "undefined" ? null : window.navigator;
}

export function hasAndroidBridge() {
  return typeof window !== "undefined" && Boolean(window.AndroidBridge);
}

export function hasIosBridge() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.webkit?.messageHandlers?.AppBridge)
  );
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
  if (/iPhone|iPad|iPod/i.test(ua)) return PLATFORM.IOS;
  if (/Mac/i.test(platform)) return PLATFORM.MAC;
  if (/Win/i.test(platform)) return PLATFORM.WINDOWS;
  if (/Linux/i.test(platform)) return PLATFORM.LINUX;

  return PLATFORM.UNKNOWN;
}

export function resolveAppConfig() {
  if (hasAndroidBridge()) return createAndroidConfig(window.AndroidBridge);
  if (hasIosBridge()) return createIosConfig();
  if (hasExtensionRuntime())
    return createExtensionConfig(detectBrowserPlatform());

  return createDefaultConfig(detectBrowserPlatform());
}

export function isNativeApp(appInfo) {
  return appInfo?.env === RUN_ENV.NATIVE;
}

export function isBrowserApp(appInfo) {
  return appInfo?.env === RUN_ENV.BROWSER;
}

export function isExtensionApp(appInfo) {
  return appInfo?.env === RUN_ENV.EXTENSION;
}

export function isAndroidApp(appInfo) {
  return isNativeApp(appInfo) && appInfo?.platform === PLATFORM.ANDROID;
}

export function isIosApp(appInfo) {
  return isNativeApp(appInfo) && appInfo?.platform === PLATFORM.IOS;
}

export {RUN_ENV, PLATFORM};
