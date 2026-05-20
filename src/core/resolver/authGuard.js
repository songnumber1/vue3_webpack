import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {
  AUTH_FAILURE_REASONS,
  AUTH_MOCK_SCENARIOS,
  AUTH_MOCK_SCENARIO_STORAGE_KEY,
  USE_MOCK_AUTH,
  ALLOW_LOCAL_STORAGE_MOCK_AUTH,
  ENABLE_AUTH_GUARD_DEBUG,
  ENABLE_AUTH_GUARD_CACHE,
} from "@/constants/auth";
import {shouldUseFrontendMockApi} from "@/constants/apiMode";
import {accessApiMock} from "@/api/mock/accessApi.mock";
import {useAuthStore} from "@/stores/authStore";
import {logInfo} from "@/utils/logger";
import {resolveAuthAccessResult} from "@/adapters/authResponseAdapter";
function createAccessPayload(to) {
  return {
    language: "ko",
    entryType: to?.name === "chat" ? "chat" : "main",
    shareId: to?.params?.shareId || null,
    chatId: to?.params?.id || null,
    msgId: null,
    studioId: to?.query?.studioId || null,
  };
}

function getStoredMockScenario() {
  if (typeof window === "undefined") {
    return process.env.VUE_APP_MOCK_AUTH_SCENARIO || null;
  }

  return (
    window.localStorage.getItem(AUTH_MOCK_SCENARIO_STORAGE_KEY) ||
    process.env.VUE_APP_MOCK_AUTH_SCENARIO ||
    null
  );
}

function shouldUseMockAuth() {
  return (
    shouldUseFrontendMockApi() ||
    USE_MOCK_AUTH ||
    (ALLOW_LOCAL_STORAGE_MOCK_AUTH && Boolean(getStoredMockScenario()))
  );
}

function debugAuthGuard(...args) {
  if (ENABLE_AUTH_GUARD_DEBUG) {
    logInfo("[auth-guard]", ...args);
  }
}
async function requestAccessInfo(authAxios, payload) {
  const useMock = shouldUseMockAuth();
  const scenario = getStoredMockScenario() || AUTH_MOCK_SCENARIOS.AUTHENTICATED;

  debugAuthGuard("request access/info.do", {
    useMock,
    scenario: useMock ? scenario : "live",
    endpoint: API_ENDPOINTS.ACCESS_INFO,
    payload,
  });

  if (useMock) {
    return accessApiMock.getAccessInfo(payload, {scenario});
  }

  if (!authAxios) {
    throw new Error("[authGuard] Auth axios instance is not initialized.");
  }

  const response = await authAxios.post(API_ENDPOINTS.ACCESS_INFO, payload);

  return response?.data || {};
}
function normalizeAccessResult(accessInfo = {}) {
  return resolveAuthAccessResult(accessInfo);
}
export async function ensureRouteAuthenticated({to, authAxios, force = false}) {
  const authStore = useAuthStore();

  if (
    ENABLE_AUTH_GUARD_CACHE &&
    !force &&
    authStore.authChecked &&
    authStore.isAuthenticated
  ) {
    debugAuthGuard(
      "skip access/info.do because auth store is already authenticated"
    );

    return {
      authenticated: true,
      reason: AUTH_FAILURE_REASONS.AUTHENTICATED,
    };
  }

  const payload = createAccessPayload(to);

  try {
    const accessInfo = await requestAccessInfo(authAxios, payload);
    const result = normalizeAccessResult(accessInfo);

    debugAuthGuard("access/info.do normalized result", result);

    if (result.authenticated) {
      authStore.setAuthenticatedAccessInfo(result.accessInfo);
    } else {
      authStore.setAuthFailure(result.reason, result.accessInfo);
    }

    return result;
  } catch (error) {
    debugAuthGuard("access/info.do error", error);

    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      authStore.setAuthFailure(AUTH_FAILURE_REASONS.LOGIN_REQUIRED);

      return {
        authenticated: false,
        reason: AUTH_FAILURE_REASONS.LOGIN_REQUIRED,
        error,
      };
    }

    authStore.setAuthError(error);

    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.AUTH_ERROR,
      error,
    };
  }
}
