import { reactive, readonly } from "vue";
import { resolveBreakpoint, BREAKPOINTS, BP } from "@/constants/breakpoints";

// Responsive manager (plugin)
// - Provides a single reactive state for width/breakpoint
// - Exposes the same API via provide/inject and this.$responsive (Option API)

export default {
  install(app) {
    const state = reactive({
      width: typeof window !== "undefined" ? window.innerWidth : 1200,
      bp: BP.LG,
    });

    const recompute = () => {
      state.width = typeof window !== "undefined" ? window.innerWidth : state.width;
      state.bp = resolveBreakpoint(state.width);
    };

    // initialize
    recompute();

    if (typeof window !== "undefined") {
      window.addEventListener("resize", recompute, { passive: true });
    }

    const api = {
      // constants (for UI copy / 조건 분기에서 사용)
      BP,
      BREAKPOINTS,

      // state
      state: readonly(state),

      // helpers
      get width() {
        return state.width;
      },
      get bp() {
        return state.bp;
      },
      isSm() {
        return state.bp === BP.SM;
      },
      isMd() {
        return state.bp === BP.MD;
      },
      isLg() {
        return state.bp === BP.LG;
      },
      isMobile() {
        return state.bp === BP.SM;
      },

      // backwards-friendly
      getState() {
        return { width: state.width, bp: state.bp };
      },
    };

    app.provide("responsive", api);
    app.config.globalProperties.$responsive = api;
  },
};
