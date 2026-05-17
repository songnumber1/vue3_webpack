import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  AUTH_FAILURE_REASONS,
  AUTH_MOCK_SCENARIOS,
  AUTH_MOCK_SCENARIO_STORAGE_KEY,
  USE_MOCK_AUTH,
  ALLOW_LOCAL_STORAGE_MOCK_AUTH,
  ENABLE_AUTH_GUARD_DEBUG,
  ENABLE_AUTH_GUARD_CACHE,
} from "@/constants/auth";
import {accessApiMock} from "@/api/mock/accessApi.mock";
import {useAuthStore} from "@/stores/authStore";
import {logInfo} from "@/utils/logger";

/**
 * @description createAccessPayload 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} to - to 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function createAccessPayload(to) {
  // 계산된 결과를 호출부로 반환합니다.
  return {
    language: "ko",
    entryType: to?.name === "chat" ? "chat" : "main",
    shareId: to?.params?.shareId || null,
    chatId: to?.params?.id || null,
    msgId: null,
    studioId: to?.query?.studioId || null,
  };
}

/**
 * @description isTruthyFlag 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function isTruthyFlag(value) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (value === true) return true;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof value === "string") {
    // 계산된 결과를 호출부로 반환합니다.
    return ["true", "y", "yes", "1"].includes(value.toLowerCase());
  }
  // 계산된 결과를 호출부로 반환합니다.
  return value === 1;
}

/**
 * @description getStoredMockScenario 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getStoredMockScenario() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof window === "undefined") {
    // 계산된 결과를 호출부로 반환합니다.
    return process.env.VUE_APP_MOCK_AUTH_SCENARIO || null;
  }

  // 계산된 결과를 호출부로 반환합니다.
  return (
    window.localStorage.getItem(AUTH_MOCK_SCENARIO_STORAGE_KEY) ||
    process.env.VUE_APP_MOCK_AUTH_SCENARIO ||
    null
  );
}

/**
 * @description shouldUseMockAuth 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function shouldUseMockAuth() {
  // 계산된 결과를 호출부로 반환합니다.
  return (
    USE_MOCK_AUTH ||
    (ALLOW_LOCAL_STORAGE_MOCK_AUTH && Boolean(getStoredMockScenario()))
  );
}

/**
 * @description debugAuthGuard 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} args - args 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function debugAuthGuard(...args) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (ENABLE_AUTH_GUARD_DEBUG) {
    logInfo("[auth-guard]", ...args);
  }
}

/**
 * @description isLoginRequired 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} accessInfo - accessInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function isLoginRequired(accessInfo = {}) {
  const valid = accessInfo.valid;
  const status = String(
    accessInfo.status || accessInfo.result || ""
  ).toLowerCase();

  // 계산된 결과를 호출부로 반환합니다.
  return (
    valid === false ||
    status === "login" ||
    status === "login_required" ||
    isTruthyFlag(accessInfo.loginRequired) ||
    isTruthyFlag(accessInfo.Login) ||
    !accessInfo.user
  );
}

/**
 * @description isAccessDenied 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} accessInfo - accessInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function isAccessDenied(accessInfo = {}) {
  const status = String(
    accessInfo.status || accessInfo.result || ""
  ).toLowerCase();

  // 계산된 결과를 호출부로 반환합니다.
  return (
    status === "accessdeny" ||
    status === "access_denied" ||
    status === "access-denied" ||
    isTruthyFlag(accessInfo.accessDeny) ||
    isTruthyFlag(accessInfo.accessDenied) ||
    isTruthyFlag(accessInfo.AccessDeny)
  );
}

/**
 * @description isUserAgreementRequired 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} accessInfo - accessInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function isUserAgreementRequired(accessInfo = {}) {
  const status = String(
    accessInfo.status || accessInfo.result || ""
  ).toLowerCase();

  // 계산된 결과를 호출부로 반환합니다.
  return (
    status === "useragree" ||
    status === "user_agree" ||
    status === "user-agree" ||
    isTruthyFlag(accessInfo.userAgree) ||
    isTruthyFlag(accessInfo.UserAgree) ||
    isTruthyFlag(accessInfo.userAgreementRequired)
  );
}

/**
 * @description requestAccessInfo 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} authAxios - authAxios 입력값입니다.
 * @param {*} payload - payload 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function requestAccessInfo(authAxios, payload) {
  const useMock = shouldUseMockAuth();
  const scenario = getStoredMockScenario() || AUTH_MOCK_SCENARIOS.AUTHENTICATED;

  debugAuthGuard("request access/info.do", {
    useMock,
    scenario: useMock ? scenario : "live",
    endpoint: API_ENDPOINTS.ACCESS_INFO,
    payload,
  });

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (useMock) {
    // 계산된 결과를 호출부로 반환합니다.
    return accessApiMock.getAccessInfo(payload, {scenario});
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!authAxios) {
    throw new Error("[authGuard] Auth axios instance is not initialized.");
  }

  const response = await authAxios.post(API_ENDPOINTS.ACCESS_INFO, payload);
  // 계산된 결과를 호출부로 반환합니다.
  return response?.data || {};
}

/**
 * @description normalizeAccessResult 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} accessInfo - accessInfo 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function normalizeAccessResult(accessInfo = {}) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isAccessDenied(accessInfo)) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.ACCESS_DENIED,
      accessInfo,
    };
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isUserAgreementRequired(accessInfo)) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.USER_AGREE_REQUIRED,
      accessInfo,
    };
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (isLoginRequired(accessInfo)) {
    // 계산된 결과를 호출부로 반환합니다.
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.LOGIN_REQUIRED,
      accessInfo,
    };
  }

  // 계산된 결과를 호출부로 반환합니다.
  return {
    authenticated: true,
    reason: AUTH_FAILURE_REASONS.AUTHENTICATED,
    accessInfo,
  };
}

/**
 * @description ensureRouteAuthenticated 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function ensureRouteAuthenticated({to, authAxios, force = false}) {
  const authStore = useAuthStore();

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (
    ENABLE_AUTH_GUARD_CACHE &&
    !force &&
    authStore.authChecked &&
    authStore.isAuthenticated
  ) {
    debugAuthGuard(
      "skip access/info.do because auth store is already authenticated"
    );
    // 계산된 결과를 호출부로 반환합니다.
    return {
      authenticated: true,
      reason: AUTH_FAILURE_REASONS.AUTHENTICATED,
    };
  }

  const payload = createAccessPayload(to);

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    const accessInfo = await requestAccessInfo(authAxios, payload);
    const result = normalizeAccessResult(accessInfo);

    debugAuthGuard("access/info.do normalized result", result);

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (result.authenticated) {
      authStore.setAuthenticatedAccessInfo(result.accessInfo);
    } else {
      authStore.setAuthFailure(result.reason, result.accessInfo);
    }

    // 계산된 결과를 호출부로 반환합니다.
    return result;
  } catch (error) {
    debugAuthGuard("access/info.do error", error);
    authStore.setAuthError(error);
    // 계산된 결과를 호출부로 반환합니다.
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.AUTH_ERROR,
      error,
    };
  }
}
