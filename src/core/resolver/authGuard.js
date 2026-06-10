/**
 * @file core/resolver/authGuard.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {
  AUTH_FAILURE_REASONS,
  ENABLE_AUTH_GUARD_DEBUG,
  ENABLE_AUTH_GUARD_CACHE,
} from "@/constants/auth";
import {useAuthStore} from "@/stores/authStore";
import {logInfo} from "@/utils/logger";
import {
  resolveAuthAccessResult,
  unwrapAuthResponseBody,
} from "@/adapters/authResponseAdapter";
import {resolveAuthPolicy} from "@/auth/authPolicy";
import {API_REQUEST_KEYS as Q} from "@/constants/api/apiRequestKeys";
import {resetAppBootstrapState} from "@/composables/app/useAppBootstrap";
import {ROUTE_NAMES} from "@/constants/routeNames";

/**
 * 라우터 진입 타깃 목적지(to) 정보를 바탕으로 백엔드 보안 엔진에 전달할 파라미터 페이로드를 생성합니다.
 * @param {Object} to - Vue Router의 이동 대상 라우트 객체
 * @returns {Object} 접근 제어 API용 규격 페이로드 객체
 */
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createAccessPayload(to) {
  return {
    [Q.LANGUAGE]: "ko", // 기본 요청 국가/언어 코드 고정
    [Q.ENTRY_TYPE]: to?.name === ROUTE_NAMES.CHAT_DETAIL ? "chat" : "main", // 진입한 페이지 성격 분기
    [Q.SHARE_ID]: to?.params?.shareId || to?.params?.id || null, // 공유 페이지 진입 시 고유 공유 식별자
    [Q.CHAT_ID]: to?.params?.id || null, // 일반 대화방 진입 시 고유 대화 히스토리 식별자
    [Q.MESSAGE_ID]: null, // 특정 메시지 하이라이트 진입용 파라미터 (기본값 null)
    [Q.STUDIO_ID]: to?.query?.studioId || null, // 쿼리 스트링으로 넘어온 특화 스튜디오 룸 ID
  };
}

/**
 * 인증 가드 디버그 플래그가 활성화되어 있을 때만 선택적으로 보안 콘솔 로그를 남깁니다.
 * @param {...*} args - 콘솔에 출력할 디버깅용 파라미터 나열
 * @see {@link logInfo} 커스텀 조건부 로깅 모듈 유틸리티 함수
 */
function debugAuthGuard(...args) {
  if (ENABLE_AUTH_GUARD_DEBUG) {
    logInfo("[auth-guard]", ...args);
  }
}

/**
 * 백엔드 서버 측에 실제 유저의 토큰/계정 유효성 정보(access/info.do)를 요청합니다.
 * @param {import("axios").AxiosInstance} authAxios - 유저 인증 수단이 탑재된 가공 완료된 Axios 인스턴스
 * @param {Object} payload - {@link createAccessPayload} 유틸로 가공된 파라미터 본문
 * @returns {Promise<Object>} 서버로부터 전달받은 가공되지 않은 순수 인증 결과 객체
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function requestAccessInfo(authAxios, payload) {
  // 디버그 활성화 상태 시 현재 실서버 인증 API 요청 상태를 로깅합니다.
  debugAuthGuard("request access/info.do", {
    mode: "live",
    endpoint: API_ENDPOINTS.ACCESS_INFO,
    payload,
  });

  // 부트스트랩 단계에서 인증 Axios 인스턴스가 주입되지 않았다면 예외를 발생시킵니다.
  if (!authAxios) {
    throw new Error("[authGuard] Auth axios instance is not initialized.");
  }

  // 준비된 인증용 Axios 인스턴스를 통해 백엔드 엔드포인트로 POST 비동기 요청을 전달합니다.
  const response = await authAxios.post(
    resolveAuthPolicy().accessInfoUrl || API_ENDPOINTS.ACCESS_INFO,
    payload
  );

  return unwrapAuthResponseBody(response, {});
}

/**
 * 가공되지 않은 날것의 응답 데이터를 프론트엔드 전용 표준 규격 결과로 어댑팅 정문화합니다.
 * @param {Object} [accessInfo={}] - 원본 응답 데이터 객체
 * @returns {Object} 정형화 완료된 패스/실패 판별 결과 객체
 * @see {@link resolveAuthAccessResult} 외부 응답 규격 보정 어댑터 함수
 */
/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizeAccessResult(accessInfo = {}) {
  return resolveAuthAccessResult(accessInfo);
}

/**
 * 인증 실패가 확정되면 이전 사용자 기준 앱 bootstrap 상태를 폐기합니다.
 */
function resetAppBootstrapAfterAuthFailure() {
  resetAppBootstrapState();
}

/**
 * [외부 노출 메인 함수] 목적지 경로로의 전환이 안전한지 검증하고 인증 상태에 따라 전역 스토어를 갱신합니다.
 * @param {Object} context - 라우터 가드 실행 콘텍스트
 * @param {Object} context.to - 이동하고자 하는 목적지 라우트 객체
 * @param {import("axios").AxiosInstance} context.authAxios - 통신에 활용할 인증 Axios 인스턴스
 * @param {boolean} [context.force=false] - 캐시를 무시하고 무조건 서버에 재검증 API를 쏠지 여부 플래그
 * @returns {Promise<Object>} 인증 최종 성공 여부(`authenticated`) 및 결과 리포트 객체
 * @see {@link useAuthStore} 사용자 인증 상태값을 영구 기록 및 변동시키는 Pinia 전역 스토어
 */
export async function ensureRouteAuthenticated({to, authAxios, force = false}) {
  const authStore = useAuthStore();

  // 캐시 옵션이 켜져 있고 강제 갱신(force)이 아니며, 이미 한 번 로그인을 체크했고 인증 상태가 유효하다면 API 호출을 생략합니다.
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

  // 타깃 라우트 정보를 바탕으로 전송용 API 페이로드를 생성합니다.
  const payload = createAccessPayload(to);

  try {
    // 백엔드 인증 엔진으로부터 계정 정보 데이터를 수집합니다.
    const accessInfo = await requestAccessInfo(authAxios, payload);
    // 수집된 데이터를 프론트엔드가 즉시 읽을 수 있는 플랫한 규격 객체로 가공합니다.
    const result = normalizeAccessResult(accessInfo);

    debugAuthGuard("access/info.do normalized result", result);

    // 어댑터 가공 결과 최종 승인(authenticated: true) 상태라면 전역 스토어에 유저 정보를 안전하게 안착시킵니다.
    if (result.authenticated) {
      authStore.setAuthenticatedAccessInfo(result.accessInfo);
    } else {
      // 실패했다면 실질적인 제한 사유(만료, 권한부족, 약관동의 누락 등) 코드를 스토어에 세팅합니다.
      resetAppBootstrapAfterAuthFailure();
      authStore.setAuthFailure(result.reason, result.accessInfo);
    }

    return result;
  } catch (error) {
    debugAuthGuard("access/info.do error", error);

    // 네트워크 오류 중 HTTP status 코드가 401(Unauthorized)이거나 403(Forbidden)인 경우, 로그인이 만료된 것으로 단언합니다.
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      resetAppBootstrapAfterAuthFailure();
      authStore.setAuthFailure(AUTH_FAILURE_REASONS.LOGIN_REQUIRED);

      return {
        authenticated: false,
        reason: AUTH_FAILURE_REASONS.LOGIN_REQUIRED,
        error,
      };
    }

    // 그 외 통신 단절, 500 내부 서버 에러 등은 시스템 자체의 하드 오류로 판단하여 처리합니다.
    resetAppBootstrapAfterAuthFailure();
    authStore.setAuthError(error);

    return {
      authenticated: false,
      reason: AUTH_FAILURE_REASONS.AUTH_ERROR,
      error,
    };
  }
}
