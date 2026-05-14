/**
 * @file api.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {isAndroidApp} from "@/core/config";

const baseApi = {
  getMe: (http) => http.get("/me"),
  sendMessage: (http, payload) => http.post("/chat/messages", payload),
  getNotices: (http) => http.get("/notices"),
};

const androidApi = {
  sendMessage: (http, payload) => http.post("/app/chat/messages", payload),
};

export function resolveApi(appInfo, http) {
  const apiMap = {
    ...baseApi,
    ...(isAndroidApp(appInfo) ? androidApi : {}),
  };

  return Object.fromEntries(
    Object.entries(apiMap).map(([name, fn]) => [
      name,
      (...args) => fn(http, ...args),
    ])
  );
}
