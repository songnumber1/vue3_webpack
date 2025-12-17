import { reactive, readonly } from "vue";

/**
 * Theme manager (Vue plugin)
 *
 * Goals:
 * - Single reactive theme state
 * - Apply theme to DOM
 * - Sync theme when the *top-level element class* (html/#app) is changed externally
 *
 * Theme switching rules:
 * - Source of truth is the resolved theme name ("light" | "dim" | "dark" | "summer")
 * - DOM is kept in sync via:
 *   - <html data-theme="...">
 *   - <html class="theme-light"> (and #app as well)
 * - If someone changes html/#app class to "theme-<name>", the manager auto-syncs.
 */

const THEMES = Object.freeze(["light", "dim", "dark", "summer"]);
const THEME_CLASS_PREFIXES = ["theme-", "theme--"];

function normalizeTheme(t) {
  return THEMES.includes(t) ? t : "light";
}

function extractThemeFromClassName(className) {
  if (!className) return null;
  const classes = String(className).split(/\s+/).filter(Boolean);
  for (const c of classes) {
    for (const prefix of THEME_CLASS_PREFIXES) {
      if (c.startsWith(prefix)) {
        const candidate = c.slice(prefix.length);
        if (THEMES.includes(candidate)) return candidate;
      }
    }
  }
  return null;
}

function setThemeClass(el, theme) {
  if (!el || !el.classList) return;
  // remove known theme classes first
  for (const t of THEMES) {
    el.classList.remove(`theme-${t}`);
    el.classList.remove(`theme--${t}`);
  }
  el.classList.add(`theme-${theme}`);
}

export default {
  install(app) {
    const state = reactive({ theme: "light" });

    const applyThemeToDom = (t, { persist = true } = {}) => {
      const theme = normalizeTheme(t);
      state.theme = theme;

      if (typeof document !== "undefined") {
        const root = document.documentElement;
        root.setAttribute("data-theme", theme);
        setThemeClass(root, theme);

        const appEl = document.getElementById("app");
        if (appEl) setThemeClass(appEl, theme);
      }

      if (persist) {
        try {
          localStorage.setItem("theme", theme);
        } catch (e) {
          // ignore
        }
      }
    };

    const syncFromDom = () => {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      const appEl = document.getElementById("app");

      const themeFromRootClass = extractThemeFromClassName(root.className);
      const themeFromAppClass = extractThemeFromClassName(appEl?.className);
      const themeFromAttr = root.getAttribute("data-theme");

      const candidate =
        themeFromRootClass ||
        themeFromAppClass ||
        (THEMES.includes(themeFromAttr) ? themeFromAttr : null);

      if (candidate && candidate !== state.theme) {
        // Do not re-persist if it already came from DOM manipulation
        applyThemeToDom(candidate, { persist: true });
      }
    };

    // init (storage first, then DOM class)
    let initial = "light";
    try {
      initial = localStorage.getItem("theme") || "light";
    } catch (e) {
      // ignore
    }
    applyThemeToDom(initial, { persist: false });
    syncFromDom();

    // observe html/#app class changes
    if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
      const root = document.documentElement;
      const appEl = document.getElementById("app");

      const observer = new MutationObserver(() => syncFromDom());

      observer.observe(root, { attributes: true, attributeFilter: ["class", "data-theme"] });
      if (appEl) observer.observe(appEl, { attributes: true, attributeFilter: ["class"] });
    }

    const api = {
      THEMES,
      state: readonly(state),

      get theme() {
        return state.theme;
      },

      setTheme: (t) => applyThemeToDom(t, { persist: true }),

      getTheme: () => state.theme,

      // optional: force re-sync (useful in tests)
      syncFromDom,
    };

    app.provide("theme", api);
    app.config.globalProperties.$theme = api;
  },
};
