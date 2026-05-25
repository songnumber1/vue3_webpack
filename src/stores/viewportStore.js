/**
 * @file stores/viewportStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {defineStore} from "pinia";
import {MOBILE_BREAKPOINT_PX} from "@/platform/viewport/viewportConstants";

/**
 * @description 서버 사이드 렌더링(SSR) 컨텍스트 유무를 체크하고, 현재 브라우저의 레이아웃 뷰포트(Layout Viewport) 및 비주얼 뷰포트(Visual Viewport) 물리 해상도를 실시간 연산 추출합니다.
 * @returns {object} 가로/세로 레이아웃 및 비주얼 해상도 픽셀 정수 결과 구조체
 */
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function readViewport() {
  // SSR 환경(Node.js 컨텍스트) 등으로 전역 window 객체가 존재하지 않을 경우 예외 안전 보장 가드 처리
  if (typeof window === "undefined") {
    return {width: 0, height: 0, visualWidth: 0, visualHeight: 0};
  }

  // 모바일 가상 자판 개통 및 핀치 확대 축소를 추적하기 위해 하드웨어 윈도우 비주얼 뷰포트 포인터 참조
  const visualViewport = window.visualViewport;

  // 브라우저 렌더링 상 정밀 정수 매핑을 위해 수치 반올림(Math.round) 가공 단행
  const visualWidth = Math.round(visualViewport?.width || 0); // 확대 스케일 및 자판이 빠진 실제 눈에 보이는 가로폭
  const visualHeight = Math.round(visualViewport?.height || 0); // 확대 스케일 및 자판이 빠진 실제 눈에 보이는 세로폭

  // 레이아웃 전체 기본 영역인 innerWidth를 보존하되 유실 시 비주얼 해상도를 백업 폴백으로 충당
  const width = Math.round(window.innerWidth || visualWidth || 0);
  const height = Math.round(window.innerHeight || visualHeight || 0);

  return {width, height, visualWidth, visualHeight};
}

/**
 * @typedef {object} ViewportState
 * @property {number} width - 브라우저 창 전체의 레이아웃 가로 픽셀 너비
 * @property {number} height - 브라우저 창 전체의 레이아웃 세로 픽셀 높이
 * @property {number} visualWidth - 가상 스크롤바/소프트 자판을 제외하고 실제 인간의 눈에 식별 가능한 가로폭
 * @property {number} visualHeight - 가상 스크롤바/소프트 자판을 제외하고 실제 인간의 눈에 식별 가능한 세로폭
 * @property {number} mobileBreakpoint - 모바일 UI(컴팩트 모드) 진입을 허용하는 한계 임계점 중단점 픽셀 수치
 * @property {boolean} installed - 창 크기 및 뷰포트 추적 목적 전역 네이티브 이벤트 리스너의 개통 등록 완료 유무 플래그
 * @property {Function|null} cleanup - 메모리 누수(Leak) 방지를 위한 전역 이벤트 리스너 영구 바인딩 해제 소멸 커맨드 함수
 */

/**
 * @description 애플리케이션 전역의 기기 가시 영역(Viewport) 스케일을 실시간 모니터링하여, 모바일 반응형 수축 레이아웃 분기를 통합 제어하는 Pinia 상태 관리 스토어입니다.
 */
export const useViewportStore = defineStore("viewport", {
  state: () => ({
    width: 0,
    height: 0,
    visualWidth: 0,
    visualHeight: 0,
    mobileBreakpoint: MOBILE_BREAKPOINT_PX, // 시스템 기본 중단점 상수 바인딩 (초기값)
    installed: false,
    cleanup: null,
  }),

  getters: {
    /**
     * @description [모바일 자판 충돌 방어] 레이아웃 해상도와 비주얼 해상도를 대조하여 하이브리드 앱 내부 화면 찌그러짐을 방어하기 위한 최적의 유효 확정 가로 해상도를 연산합니다.
     * @param {ViewportState} state - Pinia 내부 반응형 상태 객체
     * @returns {number} 최종 조율되어 안전성이 확보된 앵커 가로 너비 픽셀
     */
    effectiveWidth: (state) => {
      // 유한한 숫자이면서 0보다 큰 정상적인 물리 해상도 후보 풀을 선별 필터링
      const candidates = [state.visualWidth, state.width].filter(
        (value) => Number.isFinite(value) && value > 0
      );
      // 소프트 자판이 솟구쳐 비주얼 뷰포트가 급격히 압축되었을 때를 대비하여 안전하게 최소치(Math.min)를 앵커 해상도로 채택
      return candidates.length ? Math.min(...candidates) : 0;
    },

    /**
     * @description 현재 유효 가로 너비를 기준 중단점(mobileBreakpoint)과 대조하여 컴팩트 모바일 레이아웃(LNB 수축, 하단 탭 점등 등) 활성화 유무를 도출합니다.
     * @param {ViewportState} state - Pinia 내부 반응형 상태 객  체
     * @returns {boolean} 모바일 컴팩트 뷰포트 부합 여부 플래그
     */
    isCompact: (state) => {
      const candidates = [state.visualWidth, state.width].filter(
        (value) => Number.isFinite(value) && value > 0
      );
      const effectiveWidth = candidates.length ? Math.min(...candidates) : 0;

      // 유효 해상도가 존재하며, 그것이 미리 설정된 모바일 반응형 상한 임계선 이하인지 도출 연산
      return effectiveWidth > 0 && effectiveWidth <= state.mobileBreakpoint;
    },
  },

  actions: {
    /**
     * @description 반응형 중단점 기준 수치를 동적으로 임의 조정 세팅합니다.
     * @param {number|string} value - 새롭게 지정할 임계 중단점 해상도 수치
     * @returns {void}
     */
    setBreakpoint(value) {
      const next = Number(value);
      // 무결한 한계 양의 정수 규격 구조체인지 검증 가드 처리 후 상태 갱신
      if (Number.isFinite(next) && next > 0) this.mobileBreakpoint = next;
    },

    /**
     * @description 현재 물리 브라우저 DOM 콘텍스트의 화면 가시 영역을 즉각 스캔하여 스토어의 내부 상태값들을 강제 수직 동기화합니다.
     * @returns {void}
     */
    refresh() {
      const next = readViewport();
      this.width = next.width;
      this.height = next.height;
      this.visualWidth = next.visualWidth;
      this.visualHeight = next.visualHeight;
    },

    /**
     * @description 뷰포트 추적 코어 엔진을 개통합니다. 브라우저의 리사이즈, 모바일 기기 회전(Orientation), 비주얼 스크롤 파이프라인에 동기화 훅을 연결합니다.
     * @param {object} [options={}] - 부트스트랩 인입 초기화 커스텀 옵션 팩
     * @param {number} [options.breakpoint=MOBILE_BREAKPOINT_PX] - 오버라이드할 초기 반응형 임계 중단점
     * @returns {void}
     */
    install({breakpoint = MOBILE_BREAKPOINT_PX} = {}) {
      this.setBreakpoint(breakpoint); // 중단점 픽셀 우선 설정
      this.refresh(); // 현재 날것의 윈도우 스냅샷 1차 즉시 추출

      // 이미 이벤트 리스너가 가동 중이거나 서버 사이드 렌더링 환경인 경우 중복 바인딩 파손을 방지하기 위한 이중 가드 처리
      if (this.installed || typeof window === "undefined") return;

      // 화살표 함수 구문 바인딩을 통해 내부 Pinia 인스턴스 컨텍스트(this) 참조 안정화 보장
      const refresh = () => this.refresh();

      // [성능 최적화 패시브 옵션 주입] 브라우저 스크롤 및 리사이즈 성능 저하를 방어하기 위해 { passive: true } 구문을 동반 개통 수립
      window.addEventListener("resize", refresh, {passive: true}); // PC 창 크기 변화 대응
      window.addEventListener("orientationchange", refresh, {passive: true}); // 스마트폰 가로/세로 화면 회전 핸들링 대응

      // 모바일 웹뷰 가상 자판 온오프 및 핀치 줌에 의한 마이크로 해상도 왜곡 현상을 전가 방어 모니터링하기 위해 visualViewport 버스에 락인
      window.visualViewport?.addEventListener("resize", refresh, {
        passive: true,
      });
      window.visualViewport?.addEventListener("scroll", refresh, {
        passive: true,
      });

      // 뷰 컴포넌트 언마운트 혹은 서비스 로그아웃 세션 클린업 시 메모리 누수(Memory Leak)를 차단하기 위해 해제 람다 팩을 스토어 메모리에 아카이빙
      this.cleanup = () => {
        window.removeEventListener("resize", refresh);
        window.removeEventListener("orientationchange", refresh);
        window.visualViewport?.removeEventListener("resize", refresh);
        window.visualViewport?.removeEventListener("scroll", refresh);
        this.cleanup = null; // 가비지 컬렉터 회수 유도
        this.installed = false; // 점등 해제 마킹
      };

      this.installed = true; // 코어 추적 레이어 개통 선언 마킹 완료
    },
  },
});
