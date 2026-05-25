import {MOBILE_BREAKPOINT_PX} from "@/platform/viewport/viewportConstants";

/**
 * @type {number}
 * @description 시스템 레이아웃에서 반응형 모바일 크기를 판정하기 위한 기본 중단점(Breakpoint) 픽셀 상수입니다.
 */
export const DEFAULT_MOBILE_BREAKPOINT_PX = MOBILE_BREAKPOINT_PX;

/**
 * @description 현재 접속한 모바일 브라우저의 엔진 계열(User Agent)을 분석하여 식별 코드를 반환합니다.
 * @returns {"chrome"|"default"} 모바일 브라우저 브랜드 계열 식별자
 */
export function getMobileBrowserFamily() {
  // 서버 사이드 렌더링(SSR) 환경에서의 자바스크립트 실행 크래시를 방지하기 위해 navigator 유무 확인
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent || "" : "";

  // 크롬 및 크로미움 기반 브라우저(삼성 인터넷, 웨일 등 포함) 스크리닝 정규식 검사
  if (/Chrome|Chromium/i.test(userAgent)) return "chrome";

  // 사파리, 파이어폭스 등 기타 엔진 브라우저일 경우 폴백 기본값 반환
  return "default";
}

/**
 * @typedef {object} ViewportSize
 * @property {number} width - 핀치 줌 스케일이 반영된 가시적(Visual) 뷰포트 가로폭 픽셀
 * @property {number} height - 핀치 줌 스케일 및 가상 자판 영역이 제외된 가시적(Visual) 뷰포트 세로폭 픽셀
 * @property {number} layoutWidth - 브라우저 문서가 정렬되는 레이아웃(Layout) 뷰포트 전체 가로폭 픽셀
 * @property {number} layoutHeight - 브라우저 문서가 정렬되는 레이아웃(Layout) 뷰포트 전체 세로폭 픽셀
 * @property {number} offsetTop - 가시적 뷰포트가 레이아웃 뷰포트 최상단으로부터 아래로 스크롤되거나 이동한 오프셋 거릿값
 */

/**
 * @description 레이아웃 뷰포트와 비주얼 뷰포트의 상태를 정수 단위로 정밀 동시 계측하여 오브젝트 형태로 반환합니다.
 * @returns {ViewportSize} 현재 시점의 상호보완적 뷰포트 상세 기하학 데이터
 */
export function getViewportSize() {
  const visualViewport =
    typeof window !== "undefined" ? window.visualViewport : null;

  return {
    // 1순위로 비주얼 뷰포트(실제 눈에 보이는 영역)를 측정하고, 구형 브라우저 대응을 위해 window.innerWidth로 폴백 가공 후 반올림
    width: Math.round(visualViewport?.width || window.innerWidth || 0),
    height: Math.round(visualViewport?.height || window.innerHeight || 0),

    // 순수 레이아웃 경계면 전체 너비를 window 객체에서 1순위로 채택
    layoutWidth: Math.round(window.innerWidth || visualViewport?.width || 0),
    layoutHeight: Math.round(window.innerHeight || visualViewport?.height || 0),

    // 모바일 자판 등장 시 상단 고정 헤더나 레이어가 밀리는 현상을 보정하기 위한 가상 뷰포트 오프셋 값 스캔
    offsetTop: Math.round(visualViewport?.offsetTop || 0),
  };
}

/**
 * @description 현재 클라이언트 화면이 인가된 중단점 이하의 '모바일 컴팩트 뷰포트' 상태인지 판별합니다.
 * @param {number} [breakpoint=DEFAULT_MOBILE_BREAKPOINT_PX] - 비교 대조군으로 삼을 픽셀 중단점 임계값
 * @returns {boolean} 모바일 해상도 진입 부합 플래그
 */
export function isMobileViewport(breakpoint = DEFAULT_MOBILE_BREAKPOINT_PX) {
  if (typeof window === "undefined") return false; // SSR 예외 방어

  // [모바일 키보드 인입 충돌 방지] 비주얼 뷰포트 너비와 레이아웃 뷰포트 너비 중 가장 협소하게 압축된 값을 최종 너비로 안전 채택
  const width = Math.min(
    window.visualViewport?.width || window.innerWidth || 0,
    window.innerWidth || window.visualViewport?.width || 0
  );

  // 유효한 물리 픽셀 해상도이면서 지정된 모바일 임계 범위 이하인지 평가 연산
  return width > 0 && width <= breakpoint;
}

/**
 * @description CSS `:root` 혹은 `html` 돔 엘리먼트에 문자열로 보존 중인 커스텀 속성(CSS 변수) 값을 파싱하여 순수 실수(Float) 숫자로 반환합니다.
 * @param {string} name - 탐색하고자 하는 CSS 변수 식별 문자열 (예: "--app-height")
 * @returns {number} 파싱이 완료된 픽셀 수치 데이터 (실패 및 유실 시 0)
 */
export function readRootPixelVar(name) {
  if (typeof document === "undefined") return 0;

  // document 최상단 스타일 시트 연산 집합에서 특정 변수명에 맵핑된 원품 문자열 로드
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name);

  // 문자열 단위(px, rem 등) 제거 및 순수 Float 데이터 파싱 전환
  const parsed = Number.parseFloat(value || "0");

  // 무결한 한계 한도 숫자 규격인지 자바스크립트 엔진 가드 검사 후 반환
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * @description 모바일 가상 자판 개통, 주소창 수축, CSS 변수 등 다중 후보군을 연산 대조하여 화면 파손을 유발하지 않는 최적의 기기 높이를 결정합니다.
 * @param {object} [options={}] - 높이 필터링 및 폴백 바인딩 구조체 Options 팩
 * @param {number} [options.minHeight=320] - 레이아웃이 붕괴하지 않도록 보장하는 강제 최소 임계 높이
 * @param {number} [options.fallback=720] - 모든 스캔 수치가 부재할 시 적용할 전역 폴백 디폴트 높이
 * @returns {number} 최종 연산 확정된 물리 뷰포트 높이 값
 */
export function getViewportHeight({minHeight = 320, fallback = 720} = {}) {
  if (typeof window === "undefined") return fallback;

  // 디바이스 기하학 요소 다중 후보 스냅샷 수집
  const visualHeight = Math.round(window.visualViewport?.height || 0); // 모바일 가상 자판 영역이 자동 제외된 실제 가용 스크린 높이
  const innerHeight = Math.round(window.innerHeight || 0); // 브라우저 창 내부 높이 (주소창 포함/제외 여부가 브라우저마다 상이)
  const clientHeight = Math.round(document.documentElement?.clientHeight || 0); // html 태그의 실제 렌더링 스크롤 가용 스크린 높이
  const appHeight = Math.round(readRootPixelVar("--app-height") || 0); // 외부 스크립트 등에서 별도로 동기화 보존 중인 모바일 하이브리드 보정 변수

  // 연산에 참여할 수 있는 유효 수치이면서 설정된 최소 보증 높이(minHeight) 이상인 후보군들만 필터링 정렬
  const candidates = [
    visualHeight,
    innerHeight,
    clientHeight,
    appHeight,
  ].filter((height) => Number.isFinite(height) && height >= minHeight);

  if (!candidates.length) return fallback; // 유효 후보 부재 시 사전에 정의된 대안 폴백 반환

  // 현재 모바일 반응형 뷰포트 내부 조건이 충족되었고, 소프트 자판 축소 등으로 visualHeight가 실시간 확보된 경우
  if (isMobileViewport() && visualHeight > 0) {
    // 자판이 화면을 가릴 때 화면이 찌그러지는 문제를 막기 위해 visualHeight와 최소 보증치 중 큰 값을 안전 채택
    return Math.max(visualHeight, minHeight);
  }

  // 데스크톱 혹은 일반적인 레이아웃 상태에서는 범용 window.innerHeight를 우선 순위로 둔 후 예외 방어 조합 처리
  return Math.max(innerHeight || visualHeight || clientHeight, minHeight);
}

/**
 * @description 아이폰(iOS) 노치 디자인 및 최신 안드로이드 하단 내비게이션 바 영역인 하단 물리 안전 영역(safe-area-inset-bottom)의 정밀 픽셀 수치를 돔 프롭(Probe) 기법으로 계측합니다.
 * @returns {number} 추출 연산 완료된 기기별 하단 세이프 에어리어 인셋 픽셀 물리 수치 (단위: px)
 */
export function getSafeAreaBottom() {
  if (typeof window === "undefined" || typeof document === "undefined")
    return 0;

  // 1. 런타임 메모리 가상 노드로 빈 계측용 프로브(div) 엘리먼트 동적 생성
  const probe = document.createElement("div");

  // 2. CSS 최신 표준 스펙인 env() 파라미터를 사용하여 물리 디바이스 세이프 에어리어 바닥면에 고정 앵커 스타일 바인딩 개통
  probe.style.cssText =
    "position:fixed;bottom:env(safe-area-inset-bottom);height:0;visibility:hidden;";

  // 3. 돔 트리에 임시 삽입하여 브라우저 그래픽스 엔진이 물리 하드웨어 인셋 값을 연산하도록 유도
  document.body.appendChild(probe);

  // 4. 전체 내부 윈도우 창 높이와 세이프 에어리어 인셋 기준점으로 정렬된 가상 프로브의 사각형 바닥면(bottom) 좌표간의 거리 오프셋 차를 연산
  const value = Math.max(
    0,
    Math.round(window.innerHeight - probe.getBoundingClientRect().bottom)
  );

  // 5. 계측이 종료되었으므로 메모리 누수 및 마크업 오염 방지를 위해 돔 트리에서 프로브 노드 즉각 영구 탈거 소멸
  probe.remove();

  return Number.isFinite(value) ? value : 0;
}
