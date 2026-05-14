/**
 * @file axios.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import axios from "axios";
import { isAndroidApp, isIosApp } from "@/core/config";

const baseConfig = {
  baseURL: process.env.VUE_APP_API_BASE_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
};

const androidOverride = {
  timeout: 20000,
  headers: {
    "X-Client-Platform": "android-webview"
  }
};

const iosOverride = {
  timeout: 20000,
  headers: {
    "X-Client-Platform": "ios-webview"
  }
};

const webOverride = {
  headers: {
    "X-Client-Platform": "web"
  }
};

/**
 * mergeConfig 처리 함수입니다.
 * @param {*} base 함수 실행에 필요한 입력값입니다.
 * @param {*} override 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function mergeConfig(base, override) {
  return {
    ...base,
    ...override,
    headers: {
      ...(base.headers || {}),
      ...(override.headers || {})
    }
  };
}

/**
 * resolveAxios 함수입니다.
 * @param {*} appInfo 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function resolveAxios(appInfo) {
  const override = isAndroidApp(appInfo)
    ? androidOverride
    : isIosApp(appInfo)
      ? iosOverride
      : webOverride;

  return axios.create(mergeConfig(baseConfig, override));
}
