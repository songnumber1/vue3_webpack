/**
 * @file stores/responsiveLayoutStore.js
 * @description 전역 반응형 레이아웃 판정 결과를 Pinia에 보관합니다.
 * 원천 뷰포트/플랫폼 상태는 viewportStore/platformStore가 담당하고,
 * 이 스토어는 화면 계층에서 공통으로 소비할 최종 스냅샷만 관리합니다.
 */

import {defineStore} from "pinia";

export const useResponsiveLayoutStore = defineStore("responsiveLayout", {
  state: () => ({
    isMobile: false,
    isDesktop: true,
    isCompactViewport: false,
    isMobileBrowser: false,
    isAndroidApp: false,
    isAndroidWebView: false,
    effectiveWidth: 0,
    effectiveHeight: 0,
  }),
  actions: {
    setSnapshot(snapshot = {}) {
      const nextIsMobile = Boolean(snapshot.isMobile);
      this.isMobile = nextIsMobile;
      this.isDesktop = !nextIsMobile;
      this.isCompactViewport = Boolean(snapshot.isCompactViewport);
      this.isMobileBrowser = Boolean(snapshot.isMobileBrowser);
      this.isAndroidApp = Boolean(snapshot.isAndroidApp);
      this.isAndroidWebView = Boolean(snapshot.isAndroidWebView);
      this.effectiveWidth = Number(snapshot.effectiveWidth || 0);
      this.effectiveHeight = Number(snapshot.effectiveHeight || 0);
    },
  },
});
