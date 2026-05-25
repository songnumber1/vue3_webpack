import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {SERVER_API_BASE_URL, shouldUseServerApi} from "@/constants/apiMode";
import {API_KEYS, resolveApiPolicy} from "@/constants/apiConfig";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";
import {logPlatformDebug} from "@/platform/platformDebug";

/**
 * @function resolveGenerationUrl
 * @description AI 어시스턴트에게 프롬프트 질의를 전송하여 실시간 답변 스트리밍(SSE)을 개시할 백엔드 목적지 엔드포인트 절대 URL 주소를 동적으로 판별/조합합니다.
 * @returns {string} 슬래시 정리가 완결된 최종 AI 문장 생성 요청 API 주소
 */
export function resolveGenerationUrl() {
  // 현재 가동 환경(개발 로컬 프록시 모드 vs 프로덕션 실서버 도메인 모드)에 따라 베이스 도메인을 판별합니다.
  const base = shouldUseServerApi() ? SERVER_API_BASE_URL : "/api";
  // 문자열 끝단의 중복 슬래시(//)를 정규식으로 안전하게 치환 소거한 후, 프롬프트 생성 라우트 경로를 합산합니다.
  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION}`;
}

/**
 * @function resolveGenerationResultUrl
 * @description 백엔드 비동기 큐에 쌓인 특정 생성 요청건에 대한 최종 결과 스냅샷이나 리포트를 조회하기 위한 고유 엔드포인트 URL 주소를 빌드합니다.
 * @param {string} requestId - 백엔드가 발급한 단일 질의 트래킹용 고유 리퀘스트 ID 식별 키
 * @returns {string} 쿼리 스트링 URI 인코딩 처리가 완료된 결과 조회용 API 주소
 */
export function resolveGenerationResultUrl(requestId) {
  const base = shouldUseServerApi() ? SERVER_API_BASE_URL : "/api";
  // XSS 공격 및 특수문자 깨짐 방지를 위해 요청 ID 자원을 브라우저 안전 표준 규격으로 URI 인코딩 처리합니다.
  const query = encodeURIComponent(requestId || "");
  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION_RESULT}?requestId=${query}`;
}

/**
 * @function shouldUseOverlay
 * @description 네트워크 레이턴시가 요동치기 쉬운 모바일 뷰포트 환경에서, 중복 전송이나 유저의 무단 화면 터치를 가로막는 글로벌 반투명 마스킹 레이어(Overlay)를 스크린에 띄워야 하는지 여부를 종합 진단합니다.
 * @param {Object} policy - 전역 시스템 설정 파일에서 파싱되어 넘어온 해당 API 고유 작동 정책 명세 객체
 * @param {boolean} policy.overlay - 해당 API 가동 시 화면 차단 오버레이 연동이 허용(권장)되어 있는지 여부
 * @returns {boolean} 모바일 뷰포트 조건과 시스템 전역 옵션을 동시 만족하는 최종 화면 잠금 트리거 불리언 값
 */
export function shouldUseOverlay(policy) {
  // 시스템 기기 브라우저의 레이아웃 중단점(Breakpoint) 정보를 풀링하기 위해 전역 세팅 스토어를 로드합니다.
  const settings = useSystemSettingsStore();
  // 플랫폼 공통 뷰포트 유틸을 경유하여 현재 접속한 기기 스크린 해상도가 실제 모바일급 소형 규격인지 정밀 판별합니다.
  const mobileLikeViewport = isMobileLikeViewport(settings.mobileBreakpoint);

  // 조건 진단 삼항 결합: API 고유 정책상 오버레이를 지원해야 하고 && 유저 세팅상 모바일 프로그레스 노출이 켜져 있으며 && 물리적 환경이 모바일 규격일 때 최종 참(True)으로 도출합니다.
  const result = Boolean(
    policy.overlay && settings.showMobileApiProgress && mobileLikeViewport
  );

  // [플랫폼 디버깅] 저사양 모바일 기기 현업 모니터링 시 뷰포트 계산 미스로 인한 레이아웃 크래시 요인을 추적하기 위해 환경 스냅샷 로그를 중앙 관제 로그에 전송합니다.
  logPlatformDebug("sse.overlay", {
    result,
    policyOverlay: Boolean(policy.overlay),
    showMobileApiProgress: Boolean(settings.showMobileApiProgress),
    mobileBreakpoint: settings.mobileBreakpoint,
    mobileLikeViewport,
  });

  return result;
}

/**
 * @function createStreamRequestContext
 * @description SSE(Server-Sent Events) 문장 스트리밍 네트워크 요청을 개시하기 직전, 취소 제어권(AbortController) 등록, 중복 방지 고유 요청 키(UUID 대체 키) 발급, 전역 화면 락 인디케이터 기동 및 소멸 청소 사이클(`cleanup`)을 단일 컨텍스트 패키지로 바인딩하여 반환합니다.
 * @returns {Object} 비동기 fetch 파이프라인 전후방에 장착하여 수명 주기를 제어할 네트워크 컨텍스트 코어 패키지
 */
export function createStreamRequestContext() {
  // 1. AI 텍스트 생성 네트워크 전용 차단/취소 허용 정책 명세를 조회합니다.
  const policy = resolveApiPolicy(API_KEYS.GENERATION);
  // 2. 현재 활성화된 HTTP 통신 컨트롤러들을 중앙 집중형으로 관리 및 강제 중단시키는 글로벌 전역 요청 스토어를 로드합니다.
  const apiRequestStore = useApiRequestStore();

  // 3. 현재 가동 정책이 유저의 요청 취소 버튼 클릭 동작을 지원하고 && 현재 브라우저 런타임 엔진에 AbortController 인터페이스가 실재한다면 신규 인스턴스를 즉시 개통합니다.
  const controller =
    policy.abort && typeof AbortController !== "undefined"
      ? new AbortController()
      : null;

  // 4. 네트워크 레이스 컨디션 차단 및 유니크 트래킹을 위한 타임스탬프와 난수 조합 기반 고유 요청 식별자 키를 생성합니다.
  const requestKey = `GENERATION-${Date.now()}-${Math.random()}`;
  // 5. 앞서 수립한 오버레이 진단 함수를 통해 화면 마스킹 잠금 장치를 켤지 최종 확인합니다.
  const overlay = shouldUseOverlay(policy);

  // [스토어 등록 인젝션] 생성된 취소 제어권과 오버레이 상태를 중앙 뷰 스토어 레지스트리에 입고시켜 화면 UI 단에서 반응형 인디케이터가 회전할 수 있도록 유도합니다.
  if (controller) apiRequestStore.registerController(requestKey, controller);
  if (overlay) apiRequestStore.startOverlay();

  /**
   * [가비지 컬렉션 클로저 메모리 청소 함수]
   * 스트리밍 정상 완결, 통신 장애 오류, 혹은 유저의 수동 중단 클릭 등으로 인해 해당 HTTP 커넥션 파이프라인이 완전 소멸 종료되는 시점에 반드시 다이렉트로 호출하여 전역 스토어 자원 및 오버레이 화면 락을 깔끔하게 반환 철회하는 마감 청소 헬퍼입니다.
   */
  const cleanup = () => {
    // 1. 중앙 제어 레지스트리 슬롯에서 만료된 본 요청 키 인스턴스 관계를 해제 맵핑 소거합니다.
    apiRequestStore.unregisterController(requestKey);
    // 2. 가동 중이던 모바일 반투명 터치 가림막 오버레이 차단막을 내리고 화면 터치 권한을 유저에게 다시 즉시 돌려줍니다.
    if (overlay) apiRequestStore.stopOverlay();
  };

  // 실제 fetch 비동기 통신 코어 및 컴포넌트 전송 단에서 바인딩하여 꺼내 쓸 수 있도록 캡슐화 패키지를 반환합니다.
  return {policy, controller, requestKey, overlay, cleanup};
}
