/** * 현재 실행 환경이 빌드 기준 배포/운영 프로덕션(production) 단계인지 판별하는 플래그 상수입니다.
 * @type {boolean}
 */
const isProduction = process.env.NODE_ENV === "production";

/**
 * 프론트엔드 브라우저 환경에서 임의로 상세 로그를 추적할 수 있도록 디버그 모드가 강제 활성화되었는지 판별합니다.
 * @type {boolean}
 */
const isDebugEnabled =
  // 1. 브라우저 환경(window 객체가 존재)인지 먼저 검사하여 서버 사이드 렌더링(SSR) 시의 에러를 방지합니다.
  typeof window !== "undefined" &&
  // 2. 개발자 도구의 로컬 스토리지에 'DS_DEBUG' 값이 문자열 "true"로 설정되어 있거나,
  (window.localStorage?.getItem("DS_DEBUG") === "true" ||
    // 3. 윈도우 전역 콘텍스트 변수인 `window.__DS_DEBUG__` 값이 불리언 true 상태인지 검사합니다.
    window.__DS_DEBUG__ === true);

/**
 * 인자로 전달된 로그 레벨(level)과 현재 런타임 환경 조건을 비교하여 실제 콘솔에 출력해야 하는지 여부를 판단합니다.
 * @param {string} level - 로그의 위험도 등급 명칭 (`"info"`, `"warn"`, `"error"`, `"debug"`)
 * @returns {boolean} 콘솔에 로그를 출력해야 하면 true, 숨겨야 하면 false
 */
function shouldLog(level) {
  // 개발(Development) 또는 로컬 환경일 경우 모든 시스템 로그를 무조건 투명하게 노출(true)합니다.
  if (!isProduction) return true;

  // 운영(Production) 환경인 경우에는 1. 디버그 플래그가 켜져 있어야 하고 2. 동시에 너무 자잘한 시스템 트래킹 라인인 'debug' 등급이 아닐 때만 허용합니다.
  return isDebugEnabled && level !== "debug";
}

/**
 * 시스템 가동 흐름이나 상태 변경 등 일반적인 안내 및 정보 성격의 메시지를 안전하게 로깅합니다.
 * @param {...*} args - 콘솔 창에 출력할 임의의 데이터 파라미터 나열 (가변 인자)
 * @see {@link shouldLog} 등급별 출력 가능 여부 필터링 함수
 */
export function logInfo(...args) {
  // 'info' 등급 노출 조건에 부합할 경우 브라우저 표준 내장 명령인 `console.info`를 트리거합니다.
  if (shouldLog("info")) console.info(...args);
}

/**
 * 예외 처리가 가동되었거나 데이터 변질 우려 등 주의가 필요한 상황일 때 경고(Warning) 메시지를 출력합니다.
 * @param {...*} args - 콘솔 창에 출력할 에러 컨텍스트 및 안내 데이터
 * @see {@link bootstrap} Vue 전역 에러 핸들러 등에서 내부 워닝 트래킹용으로 사용됩니다.
 */
export function logWarn(...args) {
  // 'warn' 등급 노출 조건에 부합할 경우 브라우저 표준 노란색 경고 창인 `console.warn`을 트리거합니다.
  if (shouldLog("warn")) console.warn(...args);
}

/**
 * API 통신 단절, 컴포넌트 크래시 등 치명적인 런타임 예외 장애 발생 시 에러(Error) 로그를 강제 송출합니다.
 * @param {...*} args - 콘솔 창에 빨간색으로 출력할 하드웨어/소프트웨어 에러 객체 내역
 */
export function logError(...args) {
  // 'error' 등급 노출 조건에 부합할 경우 브라우저 표준 예외 추적 명령인 `console.error`를 트리거합니다.
  if (shouldLog("error")) console.error(...args);
}
