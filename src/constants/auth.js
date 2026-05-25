/**
 * @file constants/auth/authEnvConfig.js
 * @description 시스템 환경 변수(.env) 파일을 해독하여 인앱 라우터 가드, 가상 Mocking 세션 작동 여부, 디버깅 모드 진입 플래그를 정적 수립하는 인증 인프라 설정 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

/**
 * @description 프로세스 환경 변수(process.env) 덤프 스트링 문자열을 유연한 확장형 매칭 테이블을 통해 런타임 불리언(Boolean) 데이터 타입으로 안전 변환합니다.
 * @param {string|undefined|null} value - 환경 변수 파일로부터 하이드레이션된 원시 데이터 텍스트 값
 * @param {boolean} fallback - 환경 변수 데이터가 완전히 증발(공백/Null/Undefined)되었을 때 대체 주입될 시스템 기본 보정값
 * @returns {boolean} 파싱 연산이 완료된 최종 불리언 값
 */
function readBooleanEnv(value, fallback) {
  // 예외 가드 1: 타깃 환경 변수가 정의되지 않았거나, 널 값이거나, 빈 문자열("") 상태라면 즉시 시스템 사전 낙점 폴백(fallback) 논리값으로 조기 반환
  if (value === undefined || value === null || value === "") return fallback;

  // [확장형 불리언 대조 수식]: 대소문자 요동 현상을 방지하기 위해 스트링 강제 캐스팅 후 소문자로 포맷하여 승인 키워드 풀("true", "1", "yes", "y")에 매칭되는지 합집합 검증
  return ["true", "1", "yes", "y"].includes(String(value).toLowerCase());
}

/**
 * @constant {boolean} ENABLE_AUTH_GUARD
 * @description 인앱 뷰 라우터(Vue Router)의 비정상 접근 차단 및 토큰 유효성 검증 가드 시스템 작동 여부 플래그 (기본값: true)
 */
export const ENABLE_AUTH_GUARD = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD,
  true
);

/**
 * @constant {boolean} USE_MOCK_AUTH
 * @description 백엔드 라이브 세션 서버 연동을 일시 중단하고 프론트엔드 단독 로컬 테스트를 위한 가상 모킹(Mock) 인증 모듈을 전격 가동할지 여부 플래그 (기본값: false)
 */
export const USE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_USE_MOCK_AUTH,
  false
);

/**
 * @constant {boolean} ALLOW_LOCAL_STORAGE_MOCK_AUTH
 * @description 개발자 도구 어플리케이션 영역의 로컬스토리지 제어권을 통해 런타임 모킹 세션을 임의 위변조 및 제어할 수 있도록 허용할지 여부 방어 플래그 (기본값: false)
 */
export const ALLOW_LOCAL_STORAGE_MOCK_AUTH = readBooleanEnv(
  process.env.VUE_APP_ALLOW_LOCAL_STORAGE_MOCK_AUTH,
  false
);

/**
 * @constant {string} AUTH_MOCK_SCENARIO_STORAGE_KEY
 * @description 가상 테스트 시나리오 식별자를 브라우저 로컬 스토리지 버퍼에 적재 및 상시 트래킹하기 위한 전용 문자열 고유 네임스페이스 키
 */
export const AUTH_MOCK_SCENARIO_STORAGE_KEY = "DS_AUTH_MOCK_SCENARIO";

/**
 * @constant {object} AUTH_MOCK_SCENARIOS
 * @description 가상 가동 모드(`USE_MOCK_AUTH`) 활성화 시, 프론트엔드가 인위적으로 재현 및 시뮬레이션할 수 있는 시스템 가상 시나리오의 상태별 엔트리 딕셔너리 리스트입니다.
 */
export const AUTH_MOCK_SCENARIOS = Object.freeze({
  AUTHENTICATED: "authenticated", // 모든 권한이 완벽하게 승인 확인된 정상 회원 상태 시나리오
  LOGIN_REQUIRED: "login", // 인증 세션이 만료되거나 유실되어 로그인 페이지로 추방해야 하는 상태 시나리오
  ACCESS_DENIED: "access-denied", // 계정은 있으나 특정 어시스턴트나 관리자 메뉴 진입 권한이 거부된 상태 시나리오
  USER_AGREE_REQUIRED: "user-agree", // 서비스 이용약관 개정 등으로 인해 신규 필수 서면 동의 팝업을 띄워야 하는 상태 시나리오
  ERROR: "error", // 네트워크 통신 크래시 및 미확인 내부 인증 인프라 마비 상태 시나리오
});

/**
 * @constant {object} AUTH_FAILURE_REASONS
 * @description 라우터 가드 필터링에 걸려 목적지 페이지 진입이 튕겼을 때, 이동할 타깃 리다이렉트 주소창 뒤에 쿼리스트링(`?reason=...`) 인자로 붙여 전파할 표준 사유화 식별 코드 모음입니다.
 */
export const AUTH_FAILURE_REASONS = Object.freeze({
  AUTHENTICATED: "AUTHENTICATED",
  LOGIN_REQUIRED: "LOGIN_REQUIRED",
  ACCESS_DENIED: "ACCESS_DENIED",
  USER_AGREE_REQUIRED: "USER_AGREE_REQUIRED",
  AUTH_ERROR: "AUTH_ERROR",
});

/**
 * @constant {boolean} ENABLE_AUTH_GUARD_CACHE
 * @description 매 라우팅 페이지 전환 시마다 발생하는 인증 검증 부하를 줄이기 위해 로컬 인메모리 영역에 권한 체크 스냅샷 결과를 캐싱하여 우회 통과시킬지 여부 플래그 (기본값: false)
 */
export const ENABLE_AUTH_GUARD_CACHE = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_CACHE,
  false
);

/**
 * @constant {boolean} ENABLE_AUTH_GUARD_DEBUG
 * @description 인앱 라우터 가드 통과 과정 및 토큰 파싱 흐름 로그를 브라우저 콘솔창에 디버그용으로 실시간 강제 출력할지 여부 플래그 (기본값: false)
 */
export const ENABLE_AUTH_GUARD_DEBUG = readBooleanEnv(
  process.env.VUE_APP_ENABLE_AUTH_GUARD_DEBUG,
  false
);
