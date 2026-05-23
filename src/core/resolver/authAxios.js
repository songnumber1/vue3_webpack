import axios from "axios";
import {isAndroidApp} from "@/core/config";
import {SERVER_API_BASE_URL} from "@/constants/apiMode";

const AUTH_TIMEOUT = 10000;
function resolveAuthHeaders(appInfo = {}) {
  const platform = isAndroidApp(appInfo) ? "android-webview" : "web";

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
    baseURL: SERVER_API_BASE_URL,
    timeout: Number(process.env.VUE_APP_AUTH_TIMEOUT || AUTH_TIMEOUT),
    withCredentials: true,
    headers: resolveAuthHeaders(appInfo),
  });
}
