const hasDOM = typeof window !== "undefined" && typeof document !== "undefined";
const THEME_KEY = "app-theme";
const THEME_LIST = ["light", "dim", "dark"];

function createThemeManager() {
  let currentTheme = loadInitialTheme();
  let subscribers = new Set();

  applyTheme(currentTheme);

  function loadInitialTheme() {
    if (!hasDOM) return "light";

    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved && THEME_LIST.includes(saved)) return saved;
    } catch (_) {}

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    return prefersDark ? "dark" : "light";
  }

  function applyTheme(theme) {
    if (!hasDOM) return;

    document.documentElement.setAttribute("data-theme", theme);
  }

  const getTheme = () => currentTheme;
  const getAvailableThemes = () => [...THEME_LIST];

  function setTheme(theme) {
    if (!THEME_LIST.includes(theme)) return;
    if (theme === currentTheme) return;
    currentTheme = theme;

    if (hasDOM) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (_) {}
    }

    applyTheme(theme);
    subscribers.forEach((fn) => fn(currentTheme));
  }

  function toggleTheme() {
    const idx = THEME_LIST.indexOf(currentTheme);
    const next = THEME_LIST[(idx + 1) % THEME_LIST.length];
    setTheme(next);
  }

  function subscribe(callback) {
    subscribers.add(callback);
    callback(currentTheme);
    return () => subscribers.delete(callback);
  }

  return {
    getTheme,
    getAvailableThemes,
    setTheme,
    toggleTheme,
    subscribe,
  };
}

const themeManager = createThemeManager();
export default themeManager;
