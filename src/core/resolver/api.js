/**
 * @file core/resolver/api.js
 * @description 앱 초기화와 resolver 연결을 담당하는 core 계층입니다.
 */

import {isAndroidApp} from "@/core/config/appConfig";

/**
 * @description 모든 플랫폼(일반 PC 웹, 모바일 브라우저, 확장 프로그램 등)에서 공통으로 사용하는 표준 베이스 API 엔드포인트 매핑 명세 매트릭스입니다.
 */
const baseApi = {
  getMe: (http) => http.get("/me"), // 내 프로필 정보 및 세션 조회 API
  sendMessage: (http, payload) => http.post("/chat/messages", payload), // 표준 웹 전용 실시간 채팅 메시지 전송 API
  getNotices: (http) => http.get("/notices"), // 시스템 공지사항 리스트 조회 API
};

/**
 * @description 안드로이드 하이브리드 앱 환경으로 구동 중일 때, 모바일 전용 푸시 알림, 하드웨어 연동, 혹은 앱 전용 라우팅 최적화를 위해 오버라이딩(덮어쓰기)할 앱 전용 API 명세 레이어입니다.
 */
const androidApi = {
  sendMessage: (http, payload) => http.post("/app/chat/messages", payload), // 안드로이드 앱 전용 특수 메시지 전송 API (라우트 타깃 변경)
};

/**
 * @description 현재 앱의 인프라 정보와 Axios/Fetch 등 네이티브 HTTP 통신 인스턴스를 하향 주입받아, 환경에 맞는 최적의 API 객체를 동적 빌드하고 의존성 주입(DI) 파이프라인을 체결해주는 리졸버 마스터 함수입니다.
 * @param {object} appInfo - core/config 단에서 파싱이 완료되어 넘어온 앱의 환경 정보 스냅샷 (`env`, `platform` 등 포함)
 * @param {object} http - 세션 인터셉터가 적용된 공통 Axios 통신 인스턴스
 * @returns {object} 하위 비즈니스 컴포넌트 및 스토어 레이어에서 `api.sendMessage(payload)` 형태로 즉시 호출 가능한 완성형 API 세트
 */
export function resolveApi(appInfo, http) {
  // [동적 객체 믹스인]: 기본 공통 API 셋을 베이스로 전개(Spread)하되, 만약 안드로이드 독립 앱 환경으로 최종 확정 진단되면
  // 삼항 연산자 가드를 통해 `androidApi` 스냅샷을 후순위로 합성함으로써 동일한 키인 `sendMessage` 엔드포인트를 모바일 전용 주소로 자연스럽게 오버라이딩 유도합니다.
  const apiMap = {
    ...baseApi,
    ...(isAndroidApp(appInfo) ? androidApi : {}),
  };

  // [고차 함수 커링 및 팩토리 인입]: 매번 컴포넌트 단에서 통신할 때마다 `api.sendMessage(http, payload)` 형태로 HTTP 인스턴스를 중복 주입하는 번거로움을 제거하기 위해
  // 객체를 엔트리 배열화하여 `(...args) => fn(http, ...args)` 형태로 http 인스턴스가 록인(Lock-in)된 클로저 함수 맵을 생성한 뒤 다시 순수 객체로 복원하여 반환합니다.
  return Object.fromEntries(
    Object.entries(apiMap).map(([name, fn]) => [
      name, // API 함수 식별 명칭 키 복원 (예: 'sendMessage')
      (...args) => fn(http, ...args), // 이후 호출부에서는 http 인자를 생략하고 비즈니스 페이로드만 밀어 넣을 수 있도록 가공된 래퍼(Wrapper) 엑츄에이터 바인딩
    ])
  );
}
