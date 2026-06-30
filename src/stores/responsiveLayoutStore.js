/**
 * @file stores/responsiveLayoutStore.js
 * @description 모바일 전용 UI 상태를 전역으로 제공합니다.
 */

import {defineStore} from "pinia";

export const useResponsiveLayoutStore = defineStore("responsiveLayout", {
  state: () => ({
    isMobile: true,
    isCompactViewport: true,
    isMobileBrowser: true,
    isAndroidApp: false,
    isAndroidWebView: false,
    effectiveWidth: 0,
    effectiveHeight: 0,
  }),
  actions: {
    setSnapshot(snapshot = {}) {
      this.isMobile = true;
      this.isCompactViewport = true;
      this.isMobileBrowser = true;
      this.isAndroidApp = Boolean(snapshot.isAndroidApp);
      this.isAndroidWebView = Boolean(snapshot.isAndroidWebView);
      this.effectiveWidth = Number(snapshot.effectiveWidth || 0);
      this.effectiveHeight = Number(snapshot.effectiveHeight || 0);
    },
  },
});
