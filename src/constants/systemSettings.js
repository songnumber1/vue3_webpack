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
  showMobileApiProgress: "showMobileApiProgress",
  autoScrollOnAnswer: "autoScrollOnAnswer",
});

export const DEFAULT_SYSTEM_SETTINGS = Object.freeze({
  [SYSTEM_SETTING_KEYS.useRealApi]: false,
  [SYSTEM_SETTING_KEYS.mobileBreakpoint]: 768,
  [SYSTEM_SETTING_KEYS.useVirtualKeyboard]: false,
  [SYSTEM_SETTING_KEYS.useMicrophone]: false,
  [SYSTEM_SETTING_KEYS.showGuideButton]: false,
  [SYSTEM_SETTING_KEYS.showThemeButton]: false,
  [SYSTEM_SETTING_KEYS.showSwaggerButton]: false,
  [SYSTEM_SETTING_KEYS.showNoticeMenu]: true,
  [SYSTEM_SETTING_KEYS.showPrivacyMenu]: true,
  [SYSTEM_SETTING_KEYS.showTermsMenu]: true,
  [SYSTEM_SETTING_KEYS.showPersonalizationMenu]: true,
  [SYSTEM_SETTING_KEYS.showPlaygroundMenu]: false,
  [SYSTEM_SETTING_KEYS.showLogoutButton]: false,
  [SYSTEM_SETTING_KEYS.showMobileApiProgress]: true,
  [SYSTEM_SETTING_KEYS.autoScrollOnAnswer]: false,
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
