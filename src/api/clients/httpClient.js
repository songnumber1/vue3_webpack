import axios from "axios";
import {shouldUseServerApi, SERVER_API_BASE_URL} from "@/constants/apiMode";
import {resolveApiPolicy} from "@/constants/apiConfig";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";

function resolveBaseURL() {
  if (shouldUseServerApi()) {
    return SERVER_API_BASE_URL;
  }

  return process.env.VUE_APP_API_BASE_URL || "/api";
}

function shouldShowMobileOverlay(policy) {
  try {
    const systemSettingsStore = useSystemSettingsStore();
    return Boolean(
      policy.overlay &&
      systemSettingsStore.showMobileApiProgress &&
      isMobileLikeViewport(systemSettingsStore.mobileBreakpoint)
    );
  } catch (_error) {
    return false;
  }
}

function createAbortController(policy, config) {
  if (!policy.abort || config.signal) return null;
  if (typeof AbortController === "undefined") return null;
  return new AbortController();
}

export function createHttpClient() {
  const client = axios.create({
    baseURL: resolveBaseURL(),
    timeout: Number(process.env.VUE_APP_API_TIMEOUT || 15000),
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use((config) => {
    const apiPolicy = resolveApiPolicy(config.apiKey);
    const apiRequestStore = useApiRequestStore();
    const requestKey = `${config.apiKey || "DEFAULT"}-${Date.now()}-${Math.random()}`;
    const controller = createAbortController(apiPolicy, config);
    const overlay = shouldShowMobileOverlay(apiPolicy);

    config.baseURL = resolveBaseURL();
    config.__apiRequestKey = requestKey;
    config.__apiOverlay = overlay;

    if (controller) {
      config.signal = controller.signal;
      apiRequestStore.registerController(requestKey, controller);
    }
    if (overlay) {
      apiRequestStore.startOverlay();
    }

    return config;
  });

  client.interceptors.response.use(
    (response) => {
      const apiRequestStore = useApiRequestStore();
      apiRequestStore.unregisterController(response.config?.__apiRequestKey);
      if (response.config?.__apiOverlay) apiRequestStore.stopOverlay();
      return response;
    },
    (error) => {
      const apiRequestStore = useApiRequestStore();
      apiRequestStore.unregisterController(error.config?.__apiRequestKey);
      if (error.config?.__apiOverlay) apiRequestStore.stopOverlay();
      return Promise.reject(error);
    }
  );

  return client;
}

export const httpClient = createHttpClient();

export function unwrapResponseData(response, fallback) {
  return response?.data ?? fallback;
}
