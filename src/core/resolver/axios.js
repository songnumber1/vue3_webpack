import axios from "axios";
import {isAndroidApp, isIosApp} from "@/core/config";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const baseConfig = {
  baseURL: process.env.VUE_APP_API_BASE_URL || "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
};

const androidOverride = {
  timeout: 20000,
  headers: {
    "X-Client-Platform": "android-webview",
  },
};

const iosOverride = {
  timeout: 20000,
  headers: {
    "X-Client-Platform": "ios-webview",
  },
};

const webOverride = {
  headers: {
    "X-Client-Platform": "web",
  },
};

/**
 * @description mergeConfig 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} base - base 입력값입니다.
 * @param {*} override - override 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function mergeConfig(base, override) {
  // 계산된 결과를 호출부로 반환합니다.
  return {
    ...base,
    ...override,
    headers: {
      ...(base.headers || {}),
      ...(override.headers || {}),
    },
  };
}

/**
 * @description resolveAxios 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveAxios(appInfo) {
  const override = isAndroidApp(appInfo)
    ? androidOverride
    : isIosApp(appInfo)
      ? iosOverride
      : webOverride;

  // 계산된 결과를 호출부로 반환합니다.
  return axios.create(mergeConfig(baseConfig, override));
}
