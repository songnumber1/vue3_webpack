/**
 * @file auth.js
 * @description 라우터 인증 가드와 access/info.do 로그인 확인 정책에서 사용하는 상수입니다.
 */

/**
 * 라우터 인증 가드 활성화 여부입니다.
 *
 * method: vue-router beforeEach
 * payload: route.matched meta.requireAuth
 * response: true이면 requireAuth 라우트 접근 시 access/info.do를 호출합니다.
 *
 * 중요:
 * - 인증 이슈 확인을 쉽게 하기 위해 env 기본값이 아니라 코드 상수로 관리합니다.
 * - false로 변경하면 meta.requireAuth가 있어도 로그인 확인 API를 호출하지 않습니다.
 * - 운영/테스트에서 동작 차이를 즉시 확인하려면 이 값만 true/false로 변경하세요.
 *
 * @type {boolean}
 */
// todo: 인증 시 true로 변경
export const ENABLE_AUTH_GUARD = true;

/**
 * 로그인 확인 mock 사용 여부입니다.
 *
 * method: auth guard access/info.do resolver
 * payload: access/info.do request payload
 * response: true이면 네트워크 요청 없이 mock accessInfo를 반환합니다.
 *
 * 중요:
 * - 기본값은 반드시 false입니다.
 * - true로 바꾸면 네트워크 탭에 /access/info.do가 보이지 않는 것이 정상입니다.
 * - 실제 인증 네트워크 호출 확인이 목적이면 false를 유지해야 합니다.
 *
 * @type {boolean}
 */
export const USE_MOCK_AUTH = false;

/**
 * localStorage mock 시나리오 사용 허용 여부입니다.
 *
 * 특징:
 * - true이면 localStorage의 DS_AUTH_MOCK_SCENARIO 값으로 mock 인증을 강제할 수 있습니다.
 * - false이면 localStorage 값이 있어도 실제 authAxios로 access/info.do를 호출합니다.
 * - 네트워크 호출 검증 중에는 false를 권장합니다.
 *
 * @type {boolean}
 */
export const ALLOW_LOCAL_STORAGE_MOCK_AUTH = false;

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
 * 로그인 확인 결과 캐시 사용 여부입니다.
 *
 * 특징:
 * - 기본값은 false입니다.
 * - false이면 requireAuth 라우트 진입 시마다 access/info.do를 호출합니다.
 * - true이면 이미 인증 성공한 경우 네트워크 호출을 생략합니다.
 * - 인증 문제를 디버깅할 때는 반드시 false로 유지하세요.
 *
 * @type {boolean}
 */
export const ENABLE_AUTH_GUARD_CACHE = false;

/**
 * 라우터 인증 가드 동작 로그 출력 여부입니다.
 *
 * 특징:
 * - true로 변경하면 console.info로 requireAuth 판정, mock/live 사용 여부, 인증 결과를 확인할 수 있습니다.
 * - 운영에서는 false를 유지하는 것을 권장합니다.
 *
 * @type {boolean}
 */
export const ENABLE_AUTH_GUARD_DEBUG = true;
