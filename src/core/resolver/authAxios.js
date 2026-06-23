/**
 * @file core/resolver/authAxios.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import axios from "axios";
import {isAndroidApp} from "@/core/config/appConfig";
import {SERVER_API_BASE_URL} from "@/constants/apiMode";
import {resolveAuthPolicy} from "@/auth/authPolicy";
import {attachAuthInterceptors} from "@/auth/httpAuthInterceptor";

const AUTH_TIMEOUT = 10000;
/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveAuthHeaders(appInfo = {}) {
  const policy = resolveAuthPolicy();
  const platform = isAndroidApp(appInfo) ? "android-webview" : policy.platform;

  return {
    "Content-Type": "application/json",
    "X-Client-Platform": platform,
    "X-Auth-Mode": policy.authMode,
    "X-App-Version": appInfo?.appVersion || "",
    "X-App-Build-Version": appInfo?.appBuildVersion || "",
    "X-Bridge-Version": appInfo?.bridgeVersion || "",
  };
}
export function resolveAuthAxios(appInfo = {}) {
  const policy = resolveAuthPolicy();
  const client = axios.create({
    baseURL: SERVER_API_BASE_URL,
    timeout: Number(process.env.VUE_APP_AUTH_TIMEOUT || AUTH_TIMEOUT),
    withCredentials: policy.withCredentials,
    headers: resolveAuthHeaders(appInfo),
  });
  return attachAuthInterceptors(client);
}
