/**
 * @file core/resolver/axios.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import axios from "axios";
import {isAndroidApp} from "@/core/config/appConfig";
import {SERVER_API_BASE_URL} from "@/constants/apiMode";

const baseConfig = {
  baseURL: SERVER_API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
};

const androidOverride = {
  timeout: 20000,
  headers: {
    "X-Client-Platform": "android-webview",
  },
};

const webOverride = {
  headers: {
    "X-Client-Platform": "web",
  },
};
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function mergeConfig(base, override) {
  return {
    ...base,
    ...override,
    headers: {
      ...(base.headers || {}),
      ...(override.headers || {}),
    },
  };
}
export function resolveAxios(appInfo) {
  const override = isAndroidApp(appInfo) ? androidOverride : webOverride;

  return axios.create(mergeConfig(baseConfig, override));
}
