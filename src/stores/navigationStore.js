/**
 * @file stores/navigationStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 */

import {defineStore} from "pinia";

/**
 * @description 사이드바 수축 레이아웃 상태, 모바일 전용 네비게이션 드로어 창,
 * 그리고 최근 대화 목록 팝오버 패널 등의 전역 UI 컴포넌트 시각화 상태를 통제 관장하는 스토어입니다.
 */
export const useNavigationStore = defineStore("navigation", {
  // 화면 레이아웃 디스플레이 컴포넌트 계층의 활성 상태 정의
  state: () => ({
    sidebarCollapsed: false, // 메인 좌측 네비게이션 대화방 히스토리 바가 아이콘 형태로 수축 고정되었는지 판단 플래그
    drawerOpen: false, // 태블릿 및 모바일 반응형 터치 인터랙션 시 화면 왼쪽에서 슬라이딩 인입되는 오버레이 드로어 가시성 플래그
    collapsedRecentOpen: false, // 데스크톱 사이드바 수축 상태에서 미니 플로팅 아이콘을 오버했을 때 뿜어 나오는 '최근 대화 가이드 내역' 미니 서브 패널 활성 플래그
  }),
  actions: {
    /**
     * 메인 마스터 좌측 히스토리 보드의 가로폭 수축 고정 레이아웃 모드를 동적 스위칭합니다.
     */
    setSidebarCollapsed(value) {
      this.sidebarCollapsed = Boolean(value);
    },
    /**
     * 모바일 풀 오버레이 네비게이션 드로어 윈도우의 가시 영역을 점등/소등 갱신합니다.
     */
    setDrawerOpen(value) {
      this.drawerOpen = Boolean(value);
    },
    /**
     * 사이드바 축소 상태용 전용 플로팅 간이 팝오버 서랍장의 표시 세션을 제어 제어합니다.
     */
    setCollapsedRecentOpen(value) {
      this.collapsedRecentOpen = Boolean(value);
    },
    /**
     * 대화방 리스트 링크 클릭 이동이나 모달 외곽 백드롭 마우스 클릭 시,
     * 화면을 덮고 있던 일시적 오버레이 레이어 뷰 컴포넌트들을 단번에 일괄 강제 클로즈 청소 청소 소거합니다.
     */
    closeTransientPanels() {
      this.drawerOpen = false;
      this.collapsedRecentOpen = false;
    },
  },
});
