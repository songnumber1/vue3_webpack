/**
 * @file authGuard.js
 * @description vue-router 전역 가드에서 사용하는 로그인/접근권한 확인 로직입니다.
 */

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
import {accessApiMock} from "@/api/mock/accessApi.mock";
import {useAuthStore} from "@/stores/authStore";
import {logInfo} from "@/utils/logger";

/**
 * access/info.do 요청 payload를 생성합니다.
 *
 * method: POST
 * payload: route location
 * response: { language, entryType, shareId, chatId, msgId, studioId }
 *
 * @param {import('vue-router').RouteLocationNormalized} to - 이동 대상 라우트입니다.
 * @returns {object} access/info.do 로그인 확인 요청 payload입니다.
 */
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

/**
 * Y/N, boolean, 문자열 boolean 값을 안전하게 true/false로 변환합니다.
 *
 * @param {*} value - API 응답의 boolean 유사 값입니다.
 * @returns {boolean} true로 해석 가능한 값 여부입니다.
 */
function isTruthyFlag(value) {
  if (value === true) return true;
  if (typeof value === "string") {
    return ["true", "y", "yes", "1"].includes(value.toLowerCase());
  }
  return value === 1;
}

/**
 * 현재 브라우저 localStorage에 설정된 mock 인증 시나리오를 조회합니다.
 *
 * method: localStorage.getItem
 * payload: DS_AUTH_MOCK_SCENARIO
 * response: authenticated | login | access-denied | user-agree | error
 *
 * @returns {string} mock 인증 시나리오입니다.
 */
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

/**
 * 현재 인증 확인을 mock API로 처리할지 판단합니다.
 *
 * method: env/localStorage runtime flag read
 * payload: VUE_APP_USE_MOCK_AUTH, DS_AUTH_MOCK_SCENARIO
 * response: true이면 accessApiMock, false이면 authAxios를 사용합니다.
 *
 * @returns {boolean} mock access/info.do 사용 여부입니다.
 */
function shouldUseMockAuth() {
  return (
    USE_MOCK_AUTH ||
    (ALLOW_LOCAL_STORAGE_MOCK_AUTH && Boolean(getStoredMockScenario()))
  );
}

/**
 * 인증 가드 디버그 로그를 출력합니다.
 *
 * @param {...*} args - 디버그 로그로 출력할 값입니다.
 * @returns {void}
 */
function debugAuthGuard(...args) {
  if (ENABLE_AUTH_GUARD_DEBUG) {
    logInfo("[auth-guard]", ...args);
  }
}

/**
 * access/info.do 응답에서 로그인 필요 여부를 판단합니다.
 *
 * 백엔드 응답 필드가 확정되지 않은 운영 API에 맞추기 위해 Login, loginRequired,
 * valid=false, user 없음 등 여러 케이스를 방어적으로 처리합니다.
 *
 * @param {object} accessInfo - access/info.do 응답 body입니다.
 * @returns {boolean} 로그인 필요 여부입니다.
 */
function isLoginRequired(accessInfo = {}) {
  const valid = accessInfo.valid;
  const status = String(
    accessInfo.status || accessInfo.result || ""
  ).toLowerCase();

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
 * access/info.do 응답에서 접근 거부 여부를 판단합니다.
 *
 * @param {object} accessInfo - access/info.do 응답 body입니다.
 * @returns {boolean} 접근 거부 여부입니다.
 */
function isAccessDenied(accessInfo = {}) {
  const status = String(
    accessInfo.status || accessInfo.result || ""
  ).toLowerCase();

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
 * access/info.do 응답에서 사용자 동의 필요 여부를 판단합니다.
 *
 * @param {object} accessInfo - access/info.do 응답 body입니다.
 * @returns {boolean} 사용자 동의 필요 여부입니다.
 */
function isUserAgreementRequired(accessInfo = {}) {
  const status = String(
    accessInfo.status || accessInfo.result || ""
  ).toLowerCase();

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
 * mock/live 로그인 확인 API를 호출합니다.
 *
 * method: POST
 * payload: { language, entryType, shareId, chatId, msgId, studioId }
 * response: access/info.do 응답 객체
 *
 * @param {import('axios').AxiosInstance} authAxios - 로그인 확인 전용 axios입니다.
 * @param {object} payload - access/info.do 요청 payload입니다.
 * @returns {Promise<object>} access/info.do 응답 body입니다.
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

  if (useMock) {
    return accessApiMock.getAccessInfo(payload, {scenario});
  }

  if (!authAxios) {
    throw new Error("로그인 확인 전용 axios가 생성되지 않았습니다.");
  }

  const response = await authAxios.post(API_ENDPOINTS.ACCESS_INFO, payload);
  return response?.data || {};
}

/**
 * 로그인 확인 결과를 정규화합니다.
 *
 * @param {object} accessInfo - access/info.do 응답 body입니다.
 * @returns {{authenticated: boolean, reason: string, accessInfo: object}} 라우터 가드에서 사용할 인증 결과입니다.
 */
function normalizeAccessResult(accessInfo = {}) {
  if (isAccessDenied(accessInfo)) {
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.ACCESS_DENIED,
      accessInfo,
    };
  }

  if (isUserAgreementRequired(accessInfo)) {
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.USER_AGREE_REQUIRED,
      accessInfo,
    };
  }

  if (isLoginRequired(accessInfo)) {
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.LOGIN_REQUIRED,
      accessInfo,
    };
  }

  return {
    authenticated: true,
    reason: AUTH_FAILURE_REASONS.AUTHENTICATED,
    accessInfo,
  };
}

/**
 * 라우터 가드에서 로그인 상태를 확인합니다.
 *
 * 특징:
 * - 최초 requireAuth 라우트 접근 시 access/info.do를 호출합니다.
 * - 공통 axios가 아닌 authAxios를 사용하여 interceptor 예외 처리를 분리합니다.
 * - mock 사용 시 localStorage 또는 env로 Login/AccessDeny/UserAgree 시나리오를 재현할 수 있습니다.
 * - 성공 시 authStore에 사용자/권한 정보를 저장합니다.
 * - 오류 발생 시 페이지 접근을 막고 login-required 화면으로 이동할 수 있도록 실패 결과를 반환합니다.
 *
 * @param {object} params - 로그인 확인 파라미터입니다.
 * @param {import('vue-router').RouteLocationNormalized} params.to - 이동 대상 라우트입니다.
 * @param {import('axios').AxiosInstance} params.authAxios - 로그인 확인 전용 axios입니다.
 * @param {boolean} [params.force=false] - true이면 캐시를 무시하고 다시 확인합니다.
 * @returns {Promise<{authenticated: boolean, reason: string, error?: Error}>} 로그인 확인 결과입니다.
 */
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
    authStore.setAuthError(error);
    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.AUTH_ERROR,
      error,
    };
  }
}
