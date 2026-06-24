/**
 * @file constants/api/apiPolicyResolver.js
 * @description API 요청 도메인 키 및 도메인별 런타임 제어 정책(로딩 인디케이터 토글, 중복 요청 자동 취소 가드) 선언과 해독을 전담하는 모듈입니다.
 */

/**
 * @constant {object} API_KEYS
 * @description 해독기(Resolver) 내부 및 Axios 인터셉터 단에서 서로를 유기적으로 대조 식별하기 위해 선언한 고유 API 도메인 식별 코드 키 세트입니다.
 * 오브젝트 프로퍼티 변조 방지를 위해 전격 동결(Object.freeze) 처리되었습니다.
 */
export const API_KEYS = Object.freeze({
  DEFAULT: "DEFAULT", // 일반 공통 비동기 API 통신 라우트 포인터
  GENERATION: "GENERATION", // LLM 문장 실시간 생성/스트리밍 전용 비동기 API 라우트 포인터
  CHAT_HISTORY_NEW: "CHAT_HISTORY_NEW", // 신규 대화방 생성(new.do) 전용 비동기 API 라우트 포인터
  CHAT_HISTORY_SYNC: "CHAT_HISTORY_SYNC", // 사이드바 대화 이력 백그라운드 동기화 전용 비동기 API 라우트 포인터
  SHARED_INFO: "SHARED_INFO", // 공유 URL 검증 및 조회 전용 API 라우트 포인터
  LOGIN: "LOGIN", // 사용자 로그인 및 세션 인증 전용 비동기 API 라우트 포인터
});

/**
 * @constant {object} DEFAULT_API_POLICY
 * @description 특정 API 키가 해독 매핑 테이블에 존재하지 않거나, 개별 프로퍼티 선언이 누락되었을 때 기본 기조로 자동 채택될 시스템 기본값 정책 명세입니다.
 */
export const DEFAULT_API_POLICY = Object.freeze({
  overlay: true, // 기본 기조: 서버 응답이 올 때까지 사용자의 조작 미스를 방지하기 위해 전체 화면 딤(Dim) 로딩 레이어 개통
  abort: true, // 기본 기조: 동일 엔드포인트로 연타 요청이 인입될 경우, 이전 불필요 요청 패킷을 중단(Abort) 소멸
});

/**
 * @constant {object} API_CONFIG
 * @description 각 비즈니스 도메인의 인터랙션 특성에 맞춰 `overlay` 및 `abort` 옵션을 고도로 맞춤 튜닝해 둔 라우팅 정책 매핑 매트릭스 딕셔너리입니다.
 */
export const API_CONFIG = Object.freeze({
  // 케이스 A: LLM 문장 생성(GENERATION) API 정책
  [API_KEYS.GENERATION]: Object.freeze({
    overlay: false, // 문장 생성은 수초~수십초 이상 길게 체류하므로 전체 화면을 로딩창으로 막으면 안 됨 (컴포넌트 인라인 로딩 처리 유도)
    abort: true, // 스트리밍 답변 도중 사용자가 도마 위에 다른 새 질문을 재전송하면 이전 통신 스트림 버퍼는 즉각 중단 폐기
  }),

  // 케이스 B: 신규 대화방 생성(new.do) API 정책
  [API_KEYS.CHAT_HISTORY_NEW]: Object.freeze({
    overlay: false, // 새 대화는 사용자 질문/typing("...")을 즉시 보여줘야 하므로 전체 화면 circle progress를 띄우지 않음
    abort: true, // 중복 신규 생성 요청은 기존 공통 취소 정책을 유지
  }),

  // 케이스 C: 대화 이력 백그라운드 동기화 API 정책
  [API_KEYS.CHAT_HISTORY_SYNC]: Object.freeze({
    overlay: false, // 새 대화/기존 대화 입력 중 사이드바 히스토리 재조회가 모바일 전체 circle progress를 띄우지 않도록 비차단 처리
    abort: true,
  }),

  // 케이스 D: 공유 URL 검증(SHARED_INFO) API 정책
  [API_KEYS.SHARED_INFO]: Object.freeze({
    overlay: true,
    abort: true,
  }),

  // 케이스 E: 로그인 및 본인 인증(LOGIN) API 정책
  [API_KEYS.LOGIN]: Object.freeze({
    overlay: true, // 로그인 처리 도중 사용자의 화면 이탈이나 중복 진입을 원천 차단하기 위해 전체 화면 로딩 오버레이 가동
    abort: false, // 로그인 응답 패킷의 경우 인앱 상태 전역 포맷(Reset) 로직과 얽혀 있으므로 중간 가로채기 취소(Abort)를 엄격히 불허 금지
  }),
});

/**
 * @typedef {object} ResolvedApiPolicy
 * @property {boolean} overlay - 전체 화면 딤(Dim) 처리용 글로벌 로딩 인디케이터 활성화 여부
 * @property {boolean} abort - 중복 요청 탐지 시 이전 HTTP Axios Axios 요청 통신선 강제 차단/파괴 여부
 */

/**
 * @description 주입받은 API 식별 코드를 매핑 테이블과 크로스 체킹하여, 안전 가드가 확보된 런타임 제어 정책 객체를 최종 조합 분출해주는 멱등성 보장 해독 함수입니다.
 * @param {string} apiKey - 조작 기준점이 되는 특정 API 고유 식별 명칭 (`API_KEYS` 참조)
 * @returns {ResolvedApiPolicy} 최종 산출되어 연동 모듈에 주입될 불리언 제어 플래그 세트
 */
export function resolveApiPolicy(apiKey) {
  // 타깃 식별 코드에 해당하는 정책 스냅샷을 구성하되, 존재하지 않는 미지 등록 라우트라면 런타임 에러 방지를 위해 빈 임시 객체({}) 바인딩
  const policy = API_CONFIG[apiKey] || {};

  return {
    // 엄격한 타입 가드: 단순 널 병합(`||`) 처리를 할 경우 false 값이 기본값(true)으로 역치환되는 치명적 UI 부작용이 있으므로, 반드시 typeof 연산자로 완전한 Boolean 명세가 맞는지 검증 후 안전 디폴트 수립
    overlay:
      typeof policy.overlay === "boolean"
        ? policy.overlay
        : DEFAULT_API_POLICY.overlay,

    abort:
      typeof policy.abort === "boolean"
        ? policy.abort
        : DEFAULT_API_POLICY.abort,
  };
}
