/**
 * @file authAxios.js
 * @description 로그인 확인 전용 axios 인스턴스를 생성합니다. 공통 axios interceptor와 분리하여 401/500 공통 예외 UI가 라우터 인증 체크에 개입하지 않도록 합니다.
 */

import axios from "axios";
import {isAndroidApp, isIosApp} from "@/core/config";

const AUTH_TIMEOUT = 10000;

/**
 * 플랫폼별 로그인 확인 요청 헤더를 생성합니다.
 *
 * @param {object} appInfo - resolveAppConfig에서 생성된 앱/플랫폼 정보입니다.
 * @returns {Record<string, string>} 로그인 확인 요청 전용 HTTP headers입니다.
 */
function resolveAuthHeaders(appInfo = {}) {
  const platform = isAndroidApp(appInfo)
    ? "android-webview"
    : isIosApp(appInfo)
      ? "ios-webview"
      : "web";

  return {
    "Content-Type": "application/json",
    "X-Client-Platform": platform,
    "X-App-Version": appInfo?.appVersion || "",
    "X-App-Build-Version": appInfo?.appBuildVersion || "",
    "X-Bridge-Version": appInfo?.bridgeVersion || "",
  };
}

/**
 * 로그인 확인 전용 axios를 생성합니다.
 *
 * 특징:
 * - 공통 axios interceptor를 적용하지 않습니다.
 * - access/info.do 로그인 체크 실패 시 라우터 가드에서 직접 처리합니다.
 * - Web/Android/iOS 공통으로 사용할 수 있는 최소 header만 포함합니다.
 *
 * @param {object} appInfo - resolveAppConfig에서 생성된 앱/플랫폼 정보입니다.
 * @returns {import('axios').AxiosInstance} 로그인 확인 전용 axios 인스턴스입니다.
 */
export function resolveAuthAxios(appInfo = {}) {
  return axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || "/api",
    timeout: Number(process.env.VUE_APP_AUTH_TIMEOUT || AUTH_TIMEOUT),
    withCredentials: true,
    headers: resolveAuthHeaders(appInfo),
  });
}
