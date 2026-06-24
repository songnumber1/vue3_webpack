/**
 * @file core/resolver/authAxios.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
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
