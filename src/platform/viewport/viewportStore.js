import {defineStore} from "pinia";
import {MOBILE_BREAKPOINT_PX} from "@/platform/viewport/viewportConstants";

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

/**
 * Shared viewport store.
 *
 * Existing visualViewport/keyboard-specific utilities remain intact. This store
 * only centralizes the basic viewport measurements used by layout decisions so
 * components do not each attach independent resize listeners.
 */
export const useViewportStore = defineStore("viewport", {
  state: () => ({
    width: 0,
    height: 0,
    visualWidth: 0,
    visualHeight: 0,
    mobileBreakpoint: MOBILE_BREAKPOINT_PX,
    installed: false,
    cleanup: null,
  }),
  getters: {
    effectiveWidth: (state) => {
      const candidates = [state.visualWidth, state.width].filter(
        (value) => Number.isFinite(value) && value > 0
      );
      return candidates.length ? Math.min(...candidates) : 0;
    },
    isCompact: (state) => {
      const candidates = [state.visualWidth, state.width].filter(
        (value) => Number.isFinite(value) && value > 0
      );
      const effectiveWidth = candidates.length ? Math.min(...candidates) : 0;
      return effectiveWidth > 0 && effectiveWidth <= state.mobileBreakpoint;
    },
  },
  actions: {
    setBreakpoint(value) {
      const next = Number(value);
      if (Number.isFinite(next) && next > 0) this.mobileBreakpoint = next;
    },
    refresh() {
      const next = readViewport();
      this.width = next.width;
      this.height = next.height;
      this.visualWidth = next.visualWidth;
      this.visualHeight = next.visualHeight;
    },
    install({breakpoint = MOBILE_BREAKPOINT_PX} = {}) {
      this.setBreakpoint(breakpoint);
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
