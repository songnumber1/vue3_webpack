import { reactive, readonly } from "vue";

const THEMES = ["light", "dim", "dark", "summer"];
const STORAGE_KEY = "app-theme";
const CLASS_PREFIX = "theme-";

function normalizeTheme(theme) {
  return THEMES.includes(theme) ? theme : "light";
}

function extractThemeFromClass(className = "") {
  return (
    className
      .split(/\s+/)
      .find((c) => c.startsWith(CLASS_PREFIX))
      ?.replace(CLASS_PREFIX, "") || null
  );
}

function applyThemeClass(el, theme) {
  if (!el?.classList) return;

  THEMES.forEach((t) => el.classList.remove(`${CLASS_PREFIX}${t}`));
  el.classList.add(`${CLASS_PREFIX}${theme}`);
}

export default {
  install(app) {
    const state = reactive({
      theme: "light",
    });

    const applyTheme = (theme, { persist = true } = {}) => {
      const resolved = normalizeTheme(theme);
      state.theme = resolved;

      if (typeof document !== "undefined") {
        const root = document.documentElement;
        const appEl = document.getElementById("app");

        root.setAttribute("data-theme", resolved);
        applyThemeClass(root, resolved);
        if (appEl) applyThemeClass(appEl, resolved);
      }

      if (persist) {
        try {
          localStorage.setItem(STORAGE_KEY, resolved);
        } catch (_) {}
      }
    };

    const syncFromDom = () => {
      if (typeof document === "undefined") return;

      const root = document.documentElement;
      const appEl = document.getElementById("app");

      const fromAttr = root.getAttribute("data-theme");
      const fromRootClass = extractThemeFromClass(root.className);
      const fromAppClass = extractThemeFromClass(appEl?.className);

      const candidate = fromAttr || fromRootClass || fromAppClass;

      if (candidate && candidate !== state.theme) {
        applyTheme(candidate, { persist: true });
      }
    };

    let initial = "light";
    try {
      initial = localStorage.getItem(STORAGE_KEY) || "light";
    } catch (_) {}

    applyTheme(initial, { persist: false });
    syncFromDom();

    // 🔹 observe DOM changes
    if (typeof MutationObserver !== "undefined") {
      const observer = new MutationObserver(syncFromDom);

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "data-theme"],
      });

      const appEl = document.getElementById("app");
      if (appEl) {
        observer.observe(appEl, {
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    }

    const api = {
      THEMES,

      state: readonly(state),

      get theme() {
        return state.theme;
      },

      setTheme(theme) {
        applyTheme(theme, { persist: true });
      },

      getTheme() {
        return state.theme;
      },

      syncFromDom,
    };

    app.provide("theme", api);
    app.config.globalProperties.$theme = api;
  },
};
