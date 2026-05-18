import axios from "axios";
import {isAndroidApp, isIosApp} from "@/core/config";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const AUTH_TIMEOUT = 10000;

/**
 * @description resolveAuthHeaders 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function resolveAuthHeaders(appInfo = {}) {
  const platform = isAndroidApp(appInfo)
    ? "android-webview"
    : isIosApp(appInfo)
      ? "ios-webview"
      : "web";

  // 계산된 결과를 호출부로 반환합니다.
  return {
    "Content-Type": "application/json",
    "X-Client-Platform": platform,
    "X-App-Version": appInfo?.appVersion || "",
    "X-App-Build-Version": appInfo?.appBuildVersion || "",
    "X-Bridge-Version": appInfo?.bridgeVersion || "",
  };
}

/**
 * @description resolveAuthAxios 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} appInfo - appInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function resolveAuthAxios(appInfo = {}) {
  // 계산된 결과를 호출부로 반환합니다.
  return axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || "/api",
    timeout: Number(process.env.VUE_APP_AUTH_TIMEOUT || AUTH_TIMEOUT),
    withCredentials: true,
    headers: resolveAuthHeaders(appInfo),
  });
}
