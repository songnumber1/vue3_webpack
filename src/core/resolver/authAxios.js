import axios from "axios";
import {isAndroidApp, isIosApp} from "@/core/config";

const AUTH_TIMEOUT = 10000;
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
export function resolveAuthAxios(appInfo = {}) {
  return axios.create({
    baseURL: process.env.VUE_APP_API_BASE_URL || "/api",
    timeout: Number(process.env.VUE_APP_AUTH_TIMEOUT || AUTH_TIMEOUT),
    withCredentials: true,
    headers: resolveAuthHeaders(appInfo),
  });
}
