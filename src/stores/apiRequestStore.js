import {defineStore} from "pinia";

/**
 * @description 현재 백엔드 서버 엔드포인트 게이트웨이 측과 동기식 통신 중인 활성 비동기 API 요청들의 생명주기를 레지스트리에 보존하고,
 * 화면 이동 및 취소 단추 연타 시 미완결 패킷들을 즉각 추적 가로채 강제 낙태 낙태 취소 소멸(Abort)시키는 요청 오케스트레이션 관리자 스토어입니다.
 */
export const useApiRequestStore = defineStore("apiRequest", {
  // 실시간 기동 중인 활성 비동기 인프라 패킷들의 라이브 레지스트리 상태 정의 명세
  state: () => ({
    activeOverlayCount: 0, // 현재 브라우저 전면 화면 레이아웃을 마우스 클릭 잠금 방어하고 있는 로딩 스피너/화면 차단 딤 레이어 오버레이의 총 누적 스택 개수
    controllers: {}, // 강제 중단 시그널 전달용 브라우저 네이티브 네이티브 `AbortController` 인스턴스 인스턴스들을 고유 라우터 세션 키별로 적치 보존해 두는 해시 보관소 맵
  }),
  getters: {
    // 1개 이상의 API가 화면 전면 차단형 트랜잭션을 밀어붙이고 있어서 사용자 인터랙션을 불허 마킹해야 하는지 판별 게터
    isOverlayVisible: (state) => state.activeOverlayCount > 0,
  },
  actions: {
    /**
     * 무거운 동기식 필수 자원 다운로드 트랜잭션이 개시될 때 로딩 화면 레이어 차단 누적 카운트를 1단 단위 스택 증가 점등 시킵니다.
     */
    startOverlay() {
      this.activeOverlayCount += 1;
    },
    /**
     * 특정 트랜잭션 요청이 무사 완료 완결 혹은 타임아웃 종료되었을 때 차단 카운트를 차감 소등 유도하며 음수 언더플로우를 방어 가드합니다.
     */
    stopOverlay() {
      this.activeOverlayCount = Math.max(this.activeOverlayCount - 1, 0); // 최소 0 하한선 사양 가드 유지 보장
    },
    /**
     * @function registerController
     * @description 특정 비동기 통신 함수(ex: axios, fetch 통신)가 출발 트리거되는 즉시, 본인의 통신 세션을 가로채 소멸시킬 수 있는 리모컨 수신기(`AbortController`) 인스턴스를 스토어 중앙 맵에 등록 대행합니다.
     * @param {string} key - 해당 비동기 요청 세션의 식별 명칭 고유 라우터 키 (예: 'FETCH_USER_PROFILE_TS')
     * @param {AbortController} controller - 브라우저 원시 규격 표준 어보트 컨트롤러 인스턴스 본품
     */
    registerController(key, controller) {
      if (!key || !controller) return; // 필수 인자값 유실 가드 탈출
      this.controllers = {...this.controllers, [key]: controller}; // 불변 구조 리액티비티 해시 맵 병합 동기화 수립
    },
    /**
     * 특정 통신 트랜잭션이 물리적 네트워크 낙오 없이 깔끔하게 조기 완결 마감되어, 더 이상 강제 중단 추적 관리가 불필요해진 경우 레지스트리 내부 메모리 공간에서 맵 소거 소거 삭제합니다.
     */
    unregisterController(key) {
      if (!key || !this.controllers[key]) return;
      const next = {...this.controllers};
      delete next[key]; // 해시 노드 소거 리셋
      this.controllers = next;
    },
    /**
     * @function abort
     * @description [네트워크 인프라 강제 청소 소멸 처리] 유저가 질문 답변 도중 '생성 취소' 단추를 명시적으로 터치 연타했거나,
     * 혹은 이전 화면 대화방 탭을 급작스럽게 백화 이탈 체인지했을 때 미완결 라이브 통신 패킷 스트림 회선을 물리적으로 단절 폭파 폭파 시킵니다.
     * @param {string} [key] - 특정 저격 대상 통신 키 세션명 (생략 주입 시 현재 맵 레지스트리에 활성 등재된 전 세계 모든 통신 컨트롤러들을 일괄 폭파 일제 소거 폭파시킵니다.)
     */
    abort(key) {
      // 케이스 A: 특정 타깃 식별 키가 주입 인입된 경우, 정밀 스나이핑하여 해당 1개의 물리 통신 회선 세션만 연결 단절 단절 처단합니다.
      if (key && this.controllers[key]) {
        this.controllers[key].abort(); // 네이티브 커널 영역 취소 브로드캐스팅 시그널 전파 전송
        this.unregisterController(key); // 메모리 맵 레지스트리 버퍼 적치 삭제
        return;
      }

      // 케이스 B: 키 인자가 공백 유실 유실 전달된 마스터 일제 소거 모드인 경우, 맵 내에 동착 중인 모든 Abort 소켓 리모컨들을 루프 순회하여 일제히 가동 단절 단절 폭파시킵니다.
      Object.values(this.controllers).forEach(
        (controller) => controller?.abort?.() // 방어적 옵셔널 체이닝 안심 구동 시동
      );
      this.controllers = {}; // 마스터 레지스트리 공장 전면 포맷 클리어
    },
  },
});
