export const SYSTEM_SETTINGS_STORAGE_KEY = "ds-assistant-system-settings";

export const SYSTEM_SETTING_KEYS = Object.freeze({
  useRealApi: "useRealApi",
  mobileBreakpoint: "mobileBreakpoint",
  useVirtualKeyboard: "useVirtualKeyboard",
  useMicrophone: "useMicrophone",
  showGuideButton: "showGuideButton",
  showThemeButton: "showThemeButton",
  showSwaggerButton: "showSwaggerButton",
  showNoticeMenu: "showNoticeMenu",
  showPrivacyMenu: "showPrivacyMenu",
  showTermsMenu: "showTermsMenu",
  showPersonalizationMenu: "showPersonalizationMenu",
  showPlaygroundMenu: "showPlaygroundMenu",
  showLogoutButton: "showLogoutButton",
});

export const DEFAULT_SYSTEM_SETTINGS = Object.freeze({
  [SYSTEM_SETTING_KEYS.useRealApi]: true,
  [SYSTEM_SETTING_KEYS.mobileBreakpoint]: 768,
  [SYSTEM_SETTING_KEYS.useVirtualKeyboard]: true,
  [SYSTEM_SETTING_KEYS.useMicrophone]: true,
  [SYSTEM_SETTING_KEYS.showGuideButton]: true,
  [SYSTEM_SETTING_KEYS.showThemeButton]: true,
  [SYSTEM_SETTING_KEYS.showSwaggerButton]: true,
  [SYSTEM_SETTING_KEYS.showNoticeMenu]: true,
  [SYSTEM_SETTING_KEYS.showPrivacyMenu]: true,
  [SYSTEM_SETTING_KEYS.showTermsMenu]: true,
  [SYSTEM_SETTING_KEYS.showPersonalizationMenu]: true,
  [SYSTEM_SETTING_KEYS.showPlaygroundMenu]: true,
  [SYSTEM_SETTING_KEYS.showLogoutButton]: true,
});

export function normalizeSystemSettings(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const next = {...DEFAULT_SYSTEM_SETTINGS};

  Object.keys(DEFAULT_SYSTEM_SETTINGS).forEach((key) => {
    if (!(key in source)) return;
    if (key === SYSTEM_SETTING_KEYS.mobileBreakpoint) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(Math.max(Math.round(numeric), 320), 1440)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }
    next[key] = Boolean(source[key]);
  });

  return next;
}

export function readStoredSystemSettings() {
  if (typeof window === "undefined") return {...DEFAULT_SYSTEM_SETTINGS};
  try {
    const raw = window.localStorage.getItem(SYSTEM_SETTINGS_STORAGE_KEY);
    return normalizeSystemSettings(raw ? JSON.parse(raw) : {});
  } catch (error) {
    return {...DEFAULT_SYSTEM_SETTINGS};
  }
}

export function writeStoredSystemSettings(settings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SYSTEM_SETTINGS_STORAGE_KEY,
    JSON.stringify(normalizeSystemSettings(settings))
  );
}
