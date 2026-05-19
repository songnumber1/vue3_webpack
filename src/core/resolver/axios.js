import axios from "axios";
import {isAndroidApp, isIosApp} from "@/core/config";
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
  const override = isAndroidApp(appInfo)
    ? androidOverride
    : isIosApp(appInfo)
      ? iosOverride
      : webOverride;

  return axios.create(mergeConfig(baseConfig, override));
}
