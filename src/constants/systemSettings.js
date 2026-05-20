export const KEYBOARD_MODES = Object.freeze({
  adjustNothing: "adjustNothing",
  adjustPan: "adjustPan",
  adjustResize: "adjustResize",
});

export const KEYBOARD_MODE_OPTIONS = Object.freeze([
  {
    value: KEYBOARD_MODES.adjustResize,
    label: "adjustResize + CSS",
    description: "헤더는 고정하고 컨텐츠/입력 영역을 CSS 변수로 보정합니다.",
  },
  {
    value: KEYBOARD_MODES.adjustPan,
    label: "adjustPan",
    description: "CSS resize 보정 없이 포커스 입력 영역으로 스크롤 이동만 시도합니다.",
  },
  {
    value: KEYBOARD_MODES.adjustNothing,
    label: "adjustNothing",
    description: "키보드 높이 보정과 자동 스크롤 이동을 적용하지 않습니다.",
  },
]);

export const SYSTEM_SETTING_KEYS = Object.freeze({
  useRealApi: "useRealApi",
  mobileBreakpoint: "mobileBreakpoint",
  keyboardMode: "keyboardMode",
  useVirtualKeyboard: "useVirtualKeyboard",
  showVirtualKeyboardDebug: "showVirtualKeyboardDebug",
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
  [SYSTEM_SETTING_KEYS.keyboardMode]: KEYBOARD_MODES.adjustResize,
  [SYSTEM_SETTING_KEYS.useVirtualKeyboard]: true,
  [SYSTEM_SETTING_KEYS.showVirtualKeyboardDebug]: false,
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

function normalizeKeyboardMode(value) {
  return Object.values(KEYBOARD_MODES).includes(value)
    ? value
    : DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.keyboardMode];
}

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
    if (key === SYSTEM_SETTING_KEYS.keyboardMode) {
      next[key] = normalizeKeyboardMode(source[key]);
      return;
    }
    next[key] = Boolean(source[key]);
  });

  return next;
}
