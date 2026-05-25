/**
 * @file api/sse/common/sseErrors.js
 * @description SSE 스트리밍 계층입니다. fetch ReadableStream, data: frame 파싱, chunk commit, 모바일 lifecycle abort를 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component - 호출 방향을 먼저 확인하세요.
 */

/**
 * @description 인입된 에러 객체의 메타데이터와 예외 메시지 패턴을 대조하여, 해당 에러가 의도적인 스트림 생성 취소(사용자 중단, 모바일 백그라운드 셧다운, 하드웨어 이탈 등)로 인해 유발된 정형화된 Abort 에러인지 판별합니다.
 * @param {*} error - Catch 절 등에서 포획된 예외 객체 혹은 에러 문자열 원품
 * @returns {boolean} 명시적인 중단 에러 여부 판정 결과
 */
export function isGenerationAbortError(error) {
  // 안전한 문자열 변환: error 객체가 null이거나 특이 구조를 가졌을 때를 대비해 원품을 방어적으로 문자열 캐스팅
  const message = String(error?.message || error || "");
  return (
    // 케이스 1: 브라우저 네이티브 AbortController 및 DOMException 표준 스펙의 Name 속성 검증
    error?.name === "AbortError" ||
    // 케이스 2: 레거시 웹 표준이나 특정 브라우저 내장 Web API 환경에서 AbortError를 가리키는 레거시 숫자 코드(20) 검증
    error?.code === 20 ||
    // 케이스 3: 네이티브 브라우저, 웹킷(WebKit) 커널, 모바일 앱 웹뷰(WebView), 그리고 크롬 라이프사이클 모듈이 주입한 특수 중단 문자열 메시지 패턴을 대소문자 구분 없이(i) 정규식 패턴으로 정밀 일치 탐지
    /aborted|abort|page lifecycle ended|page lifecycle frozen|mobile page hidden|mobile page frozen|mobile page unloading|android app pause|ERR_CONNECTION_ABORTED|network error|networkerror|failed to fetch|load failed/i.test(
      message
    )
  );
}

/**
 * @description 현재 실행 중인 자바스크립트 런타임의 환경적 제약을 감안하여, 표준 Abort 시그널 파이프라인과 완벽히 호환되는 명시적인 중단(Abort) 예외 에러 객체를 동적으로 빌드 및 규격화합니다.
 * @param {string} [reason] - 에러 객체 내부에 바인딩할 명확하고 구체적인 중단 사유 메시지
 * @returns {DOMException|Error} 런타임 환경에 최적화되어 조립된 표준 AbortError 객체
 */
export function createAbortError(reason) {
  // 웹 브라우저 환경인 경우: 최신 비동기 fetch 및 스트림 취소 사유를 네이티브하게 전파할 수 있도록 표준 `DOMException` 스펙 인스턴스로 1순위 생성
  if (typeof DOMException !== "undefined") {
    return new DOMException(reason || "Aborted", "AbortError");
  }
  // Node.js SSR(서버 사이드 렌더링) 환경 또는 구형 가상 DOM 테스트 환경인 경우: DOMException 부재에 대응하기 위한 표준 Error 2순위 폴백 생성
  const error = new Error(reason || "Aborted");
  // 인터셉터 및 에러 가드 레이어와의 완벽한 명세 싱크를 위해 에러 명칭을 "AbortError"로 강제 마킹 바인딩
  error.name = "AbortError";
  return error;
}
