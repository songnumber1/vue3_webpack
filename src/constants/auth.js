/**
 * @file auth.js
 * @description 라우터 인증 가드와 access/info.do 로그인 확인 정책에서 사용하는 상수입니다.
 */

/**
 * 라우터 인증 가드 활성화 여부입니다.
 *
 * 특징:
 * - false로 변경하면 meta.requireAuth가 있어도 로그인 확인 API를 호출하지 않습니다.
 * - 운영 반영 전 임시 테스트가 필요할 때 이 한 줄만 수정하면 됩니다.
 *
 * @type {boolean}
 */
export const ENABLE_AUTH_GUARD = true;

/**
 * 로그인 확인 mock 사용 여부입니다.
 *
 * 특징:
 * - 기본값은 false이며, ENABLE_AUTH_GUARD=true이면 authAxios로 실제 access/info.do를 호출합니다.
 * - VUE_APP_USE_MOCK_AUTH=true 또는 localStorage mock scenario가 있을 때만 mock API를 사용합니다.
 *
 * @type {boolean}
 */
export const USE_MOCK_AUTH = process.env.VUE_APP_USE_MOCK_AUTH === "true";

/**
 * mock 로그인 상태를 강제로 바꿀 때 사용하는 localStorage key입니다.
 *
 * 사용 예:
 * localStorage.setItem('DS_AUTH_MOCK_SCENARIO', 'login')
 * localStorage.setItem('DS_AUTH_MOCK_SCENARIO', 'access-denied')
 * localStorage.setItem('DS_AUTH_MOCK_SCENARIO', 'user-agree')
 * localStorage.removeItem('DS_AUTH_MOCK_SCENARIO')
 *
 * @type {string}
 */
export const AUTH_MOCK_SCENARIO_STORAGE_KEY = "DS_AUTH_MOCK_SCENARIO";

/**
 * access/info.do mock 응답 시나리오입니다.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const AUTH_MOCK_SCENARIOS = Object.freeze({
  AUTHENTICATED: "authenticated",
  LOGIN_REQUIRED: "login",
  ACCESS_DENIED: "access-denied",
  USER_AGREE_REQUIRED: "user-agree",
  ERROR: "error",
});

/**
 * 라우터 인증 실패 사유입니다.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const AUTH_FAILURE_REASONS = Object.freeze({
  AUTHENTICATED: "AUTHENTICATED",
  LOGIN_REQUIRED: "LOGIN_REQUIRED",
  ACCESS_DENIED: "ACCESS_DENIED",
  USER_AGREE_REQUIRED: "USER_AGREE_REQUIRED",
  AUTH_ERROR: "AUTH_ERROR",
});

/**
 * 라우터 인증 가드 동작 로그 출력 여부입니다.
 *
 * 특징:
 * - true로 변경하면 console.info로 requireAuth 판정, mock/live 사용 여부, 인증 결과를 확인할 수 있습니다.
 * - 운영에서는 false를 유지하는 것을 권장합니다.
 *
 * @type {boolean}
 */
export const ENABLE_AUTH_GUARD_DEBUG =
  process.env.VUE_APP_AUTH_GUARD_DEBUG === "true";
