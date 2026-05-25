/**
 * @file stores/overlayStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {defineStore} from "pinia";

// 오버레이 활성화 시 최상단 body 돔 태그에 마운트 마킹할 글로벌 잠금 제어용 표준 CSS 클래스 명칭
const BODY_OVERLAY_CLASS = "app-has-overlay";
// 특별 사양이 없을 때 가상으로 기본 상속 지정될 레이어의 카테고리 디폴트 문자열
const DEFAULT_OVERLAY_KIND = "overlay";

/**
 * @function applyBodyOverlayState
 * @description [네이티브 DOM 브릿지 파이프라인] 현재 적치 활성화된 오버레이 레이어들의 갯수 및 스냅샷 사양을 대조 연산하여,
 * 최상위 HTML `<body>` 원시 노드의 클래스 리스트 및 data 속성 명세에 메타 태그 마킹을 실시간 강제 강제 반영합니다.
 * 이를 통해 레이어가 뜬 시점의 뒷배경 스크롤 잠금 및 다중 포커스 무력화 CSS 스펙을 글로벌 전역 브라우저 인터페이스에 전파 전파 수립합니다.
 * @param {Map} activeOverlays - 현재 레지스트리에 보존 마운트되어 적치된 활성 레이어 해시 맵 인스턴스
 */
/**
 * 계산된 설정 또는 사용자 선택 값을 실제 상태/DOM에 적용합니다.
 */
function applyBodyOverlayState(activeOverlays) {
  if (typeof document === "undefined") return; // SSR(서버 사이드 렌더링) 환경 노드 노드 컴파일 도중 크래시 현상 방지 가드 가탈
  const {body} = document;
  if (!body) return;

  // 순차 스택 순서를 추적하기 위해 맵의 요소들을 어레이 배열 리스트 형태로 평탄화 파싱 파싱 추출
  const entries = Array.from(activeOverlays.values());
  // 맨 마지막으로 레지스트리에 엔트리 진입 등록된 녀석이 곧 물리 화면 최상단(Z-Index 최고점)을 덮고 있는 마스터 컴포넌트가 됩니다.
  const topEntry = entries[entries.length - 1] || null;

  // 활성 등록된 오버레이가 단 1개라도 실재하면 전용 레이아웃 잠금 스타일 클래스를 body 태그에 부여하고, 전무하면 소거 제거합니다.
  body.classList.toggle(BODY_OVERLAY_CLASS, entries.length > 0);
  body.dataset.overlayCount = String(entries.length); // 레이어 다중 적치 스택 깊이 수치 돔 전파

  if (topEntry) {
    // 최상단 점유 레이어의 메타 데이터 스냅샷을 돔 데이터셋 내부에 동적 동기화 각인시킵니다.
    body.dataset.activeOverlay = topEntry.id;
    body.dataset.activeOverlayKind = topEntry.kind;
    body.dataset.activeOverlayMode = topEntry.mode || "default";
  } else {
    // 적치 오버레이가 한 장도 없다면 body의 지저분한 메타 흔적 속성 명세들을 완전 깔끔하게 소거 리셋 삭제합니다.
    delete body.dataset.activeOverlay;
    delete body.dataset.activeOverlayKind;
    delete body.dataset.activeOverlayMode;
  }
}

/**
 * @description 서비스 전역에 분산되어 산발적으로 개포되는 트랜지언트(임시 가시형) UI 레이어들(모달 팝업, 알림창, 대형 바텀시트, 툴팁 허브 등)의
 * 등록 수치를 단일 관리 레지스트리에 스택식으로 적치하고 ESC 자판 이벤트 마감 핸들링을 단일 통제 보장하는 센트럴 오케스트레이션 스토어입니다.
 */
export const useOverlayStore = defineStore("overlay", {
  state: () => ({
    // 다중 적치 팝업 컴포넌트들의 고유 식별 명세를 순서 보장형 키-밸류 컬렉션으로 파이프라이닝 적치하는 마스터 맵
    activeOverlays: new Map(),
  }),
  getters: {
    // 현재 레지스트리에 계장 등록 보존 중인 오버레이 레이어들의 총 적치 장수 게터
    activeCount: (state) => state.activeOverlays.size,
    // 화면에 최소 1개 이상의 블로킹 레이어가 점등 노출되어 있는지 여부 게터
    hasActiveOverlay: (state) => state.activeOverlays.size > 0,
    /**
     * 물리 브라우저 스크린의 맨 바깥 레이어 레이어를 독점 점유 마킹 중인 마스터 오버레이 정보를 스캔 게팅합니다.
     */
    topOverlay: (state) => {
      const entries = Array.from(state.activeOverlays.values());
      return entries[entries.length - 1] || null;
    },
  },
  actions: {
    /**
     * @function registerOverlay
     * @description 특정 UI 컴포넌트가 화면에 mount 점등 오픈되는 시점에 본인의 컴포넌트 고유 ID 명세를 전역 컨트롤 맵 레지스트리에 각인 등록 대행합니다.
     * @param {object} config - 등록 대상 오버레이의 메타 명세 명세 세트
     * @param {string} config.id - 대상 컴포넌트의 유니크 식별 아이디 문자열 키
     * @param {string} [config.kind="overlay"] - 컴포넌트의 인터페이스 종류 유형 규격 (modal, drawer, sheet 등)
     * @param {string} [config.mode="default"] - 인터랙션 처리용 보조 특수 모드 태그 분기 키
     */
    registerOverlay({id, kind = DEFAULT_OVERLAY_KIND, mode = "default"} = {}) {
      if (!id) return; // 식별 인덱스 식별 정보 유실 시 강제 가드 통과 탈출

      // 등록된 시간 타임스탬프를 부여하여 맵 컬렉션의 맨 꼬리 노드로 요소를 보존 셋 주입합니다.
      this.activeOverlays.set(id, {id, kind, mode, openedAt: Date.now()});
      applyBodyOverlayState(this.activeOverlays); // 네이티브 바디 DOM 메타 데이터 정적 동기화 강제 전파
    },
    /**
     * @function unregisterOverlay
     * @description 모달 팝업이 닫히거나 언마운트 소멸 파괴되는 시점에 호출하여 전역 레지스트리 맵에서 본인의 흔적을 말소 제거 제거합니다.
     * @param {string} id - 소멸 폐쇄를 마친 대상 오버레이 고유 식별 아이디 문자열 키
     */
    unregisterOverlay(id) {
      if (!id) return;
      this.activeOverlays.delete(id); // 맵 컬렉션 내부 메모리 소거 리셋
      applyBodyOverlayState(this.activeOverlays); // 바디 DOM 물리 메타 클래스 시퀀스 리벨런싱 전파
    },
    /**
     * 유저가 대화 화면 자체를 급작스럽게 전환 탈출하거나 전체 청소 이벤트 리셋이 구동될 때
     * 적치되어 있던 전 영역 오버레이 세션을 일괄 강제 파괴 증발 소거 처리합니다.
     */
    clearOverlays() {
      this.activeOverlays.clear();
      applyBodyOverlayState(this.activeOverlays);
    },
  },
});
