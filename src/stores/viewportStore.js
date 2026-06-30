import {defineStore} from "pinia";

function readViewport() {
  if (typeof window === "undefined") {
    return {width: 0, height: 0, visualWidth: 0, visualHeight: 0};
  }

  const visualViewport = window.visualViewport;

  const visualWidth = Math.round(visualViewport?.width || 0);
  const visualHeight = Math.round(visualViewport?.height || 0);

  const width = Math.round(window.innerWidth || visualWidth || 0);
  const height = Math.round(window.innerHeight || visualHeight || 0);

  return {width, height, visualWidth, visualHeight};
}

export const useViewportStore = defineStore("viewport", {
  state: () => ({
    width: 0,
    height: 0,
    visualWidth: 0,
    visualHeight: 0,
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
  },

  actions: {
    refresh() {
      const next = readViewport();
      this.width = next.width;
      this.height = next.height;
      this.visualWidth = next.visualWidth;
      this.visualHeight = next.visualHeight;
    },

    install() {
      this.refresh();

      if (this.installed || typeof window === "undefined") return;

      const refresh = () => this.refresh();

      window.addEventListener("resize", refresh, {passive: true});
      window.addEventListener("orientationchange", refresh, {passive: true});

      window.visualViewport?.addEventListener("resize", refresh, {
        passive: true,
      });
      window.visualViewport?.addEventListener("scroll", refresh, {
        passive: true,
      });

      this.cleanup = () => {
        window.removeEventListener("resize", refresh);
        window.removeEventListener("orientationchange", refresh);
        window.visualViewport?.removeEventListener("resize", refresh);
        window.visualViewport?.removeEventListener("scroll", refresh);
        this.cleanup = null;
        this.installed = false;
      };

      this.installed = true;
    },
  },
});
