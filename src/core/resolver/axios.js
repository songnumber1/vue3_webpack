import axios from "axios";
import {isAndroidApp} from "@/core/config";
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
