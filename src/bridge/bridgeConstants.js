/**
 * @file bridgeConstants.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

export const BRIDGE_PATH = "/bridge/";
export const WEB_API_PATH = "/web-api/";
export const JS_TO_ANDROID_PATH = "/bridge/js-to-android/";
export const ANDROID_TO_JS_PATH = "/bridge/android-to-js/";
export const BRIDGE_TIMEOUT = 5000;

export const BRIDGE_CATEGORY = {
  ALL: "all",
  WEB_API: "web-api",
  JS_TO_ANDROID: "js-to-android",
  ANDROID_TO_JS: "android-to-js"
};

export const BRIDGE_STATUS = {
  SUCCESS: "success",
  ERROR: "error"
};
