import {RUN_ENV, PLATFORM} from "./constants";
import {createDefaultConfig} from "./default";
import {createAndroidConfig} from "./android";
import {createExtensionConfig} from "./extension";

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
