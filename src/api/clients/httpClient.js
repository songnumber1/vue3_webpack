/**
 * @file api/clients/httpClient.js
 * @description HTTP client 래퍼입니다. credentials/header/공통 에러 처리 같은 API 요청 기본값을 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import axios from "axios";
import {shouldUseServerApi, SERVER_API_BASE_URL} from "@/constants/apiMode";
import {resolveApiPolicy} from "@/constants/apiConfig";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";

/**
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveBaseURL() {
  if (shouldUseServerApi()) {
    return SERVER_API_BASE_URL;
  }

  return process.env.VUE_APP_API_BASE_URL || "/api";
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
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

/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
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
