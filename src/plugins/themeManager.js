import { reactive, readonly } from "vue";

// Theme manager (plugin)
// - Provides a single reactive theme state
// - Exposes the same API via provide/inject and this.$theme (Option API)

const THEMES = Object.freeze(["light", "dim", "dark"]);

function normalizeTheme(t) {
  return THEMES.includes(t) ? t : "light";
}

export default {
  install(app) {
    const state = reactive({
      theme: "light",
    });

    const applyThemeToDom = (t) => {
      const theme = normalizeTheme(t);
      state.theme = theme;
      if (typeof document !== "undefined") {
        document.documentElement.setAttribute("data-theme", theme);
      }
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {
        // ignore
      }
    };

    // init from storage
    let initial = "light";
    try {
      initial = localStorage.getItem("theme") || "light";
    } catch (e) {
      // ignore
    }
    applyThemeToDom(initial);

    const api = {
      THEMES,
      state: readonly(state),

      get theme() {
        return state.theme;
      },
      setTheme: applyThemeToDom,
      getTheme() {
        return state.theme;
      },
    };

    app.provide("theme", api);
    app.config.globalProperties.$theme = api;
  },
};
