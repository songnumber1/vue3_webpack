/**
 * @file constants/systemSettings.js
 * @description 여러 계층에서 공유하는 상수 모음입니다. UI/런타임/이미지/설정 값의 단일 출처 역할을 합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

export const DEFAULT_MOBILE_BREAKPOINT_PX = 768;
export const FORCED_MOBILE_PLATFORM_BREAKPOINT_PX = 1440;

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
    description:
      "CSS resize 보정 없이 포커스 입력 영역으로 스크롤 이동만 시도합니다.",
  },
  {
    value: KEYBOARD_MODES.adjustNothing,
    label: "adjustNothing",
    description: "키보드 높이 보정과 자동 스크롤 이동을 적용하지 않습니다.",
  },
]);


export const PLATFORM_OVERRIDE_MODES = Object.freeze({
  auto: "auto",
  androidChrome: "android-chrome",
  androidWebView: "android-webview",
});

export const PLATFORM_OVERRIDE_OPTIONS = Object.freeze([
  {
    value: PLATFORM_OVERRIDE_MODES.auto,
    label: "Auto",
    description: "현재 브라우저/앱 환경을 자동으로 판별합니다.",
  },
  {
    value: PLATFORM_OVERRIDE_MODES.androidChrome,
    label: "Android Chrome",
    description: "웹 브라우저에서도 Android Chrome 모바일 브라우저 분기를 적용합니다.",
  },
  {
    value: PLATFORM_OVERRIDE_MODES.androidWebView,
    label: "Android WebView",
    description: "웹 브라우저에서도 Android WebView 유사 분기를 적용합니다. Native Bridge는 실제 앱에서만 호출됩니다.",
  },
]);

export const SYSTEM_SETTING_KEYS = Object.freeze({
  useRealApi: "useRealApi",
  platformOverride: "platformOverride",
  mobileBreakpoint: "mobileBreakpoint",
  keyboardMode: "keyboardMode",
  useVirtualKeyboard: "useVirtualKeyboard",
  showVirtualKeyboardDebug: "showVirtualKeyboardDebug",
  virtualKeyboardHeight: "virtualKeyboardHeight",
  bottomSheetMinHeight: "bottomSheetMinHeight",
  bottomSheetMaxHeight: "bottomSheetMaxHeight",
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
  abortChatOnMobileBackground: "abortChatOnMobileBackground",
});

export const DEFAULT_SYSTEM_SETTINGS = Object.freeze({
  [SYSTEM_SETTING_KEYS.useRealApi]: true,
  [SYSTEM_SETTING_KEYS.platformOverride]: PLATFORM_OVERRIDE_MODES.auto,
  [SYSTEM_SETTING_KEYS.mobileBreakpoint]: DEFAULT_MOBILE_BREAKPOINT_PX,
  [SYSTEM_SETTING_KEYS.keyboardMode]: KEYBOARD_MODES.adjustResize,
  [SYSTEM_SETTING_KEYS.useVirtualKeyboard]: true,
  [SYSTEM_SETTING_KEYS.showVirtualKeyboardDebug]: false,
  [SYSTEM_SETTING_KEYS.virtualKeyboardHeight]: 340,
  [SYSTEM_SETTING_KEYS.bottomSheetMinHeight]: 260,
  [SYSTEM_SETTING_KEYS.bottomSheetMaxHeight]: 720,
  [SYSTEM_SETTING_KEYS.useMicrophone]: false,
  [SYSTEM_SETTING_KEYS.showGuideButton]: false,
  [SYSTEM_SETTING_KEYS.showThemeButton]: false,
  [SYSTEM_SETTING_KEYS.showSwaggerButton]: false,
  [SYSTEM_SETTING_KEYS.showNoticeMenu]: true,
  [SYSTEM_SETTING_KEYS.showPrivacyMenu]: true,
  [SYSTEM_SETTING_KEYS.showTermsMenu]: true,
  [SYSTEM_SETTING_KEYS.showPersonalizationMenu]: true,
  [SYSTEM_SETTING_KEYS.showPlaygroundMenu]: false,
  [SYSTEM_SETTING_KEYS.showLogoutButton]: true,
  [SYSTEM_SETTING_KEYS.showMobileApiProgress]: true,
  [SYSTEM_SETTING_KEYS.autoScrollOnAnswer]: false,
  [SYSTEM_SETTING_KEYS.abortChatOnMobileBackground]: true,
});

/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
function normalizePlatformOverride(value) {
  return Object.values(PLATFORM_OVERRIDE_MODES).includes(value)
    ? value
    : DEFAULT_SYSTEM_SETTINGS[SYSTEM_SETTING_KEYS.platformOverride];
}

/**
 * 외부 입력 또는 API 응답을 내부 화면 모델에 맞게 정규화합니다.
 */
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
        ? Math.min(Math.max(Math.round(numeric), 320), FORCED_MOBILE_PLATFORM_BREAKPOINT_PX)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }
    if (key === SYSTEM_SETTING_KEYS.platformOverride) {
      next[key] = normalizePlatformOverride(source[key]);
      return;
    }
    if (key === SYSTEM_SETTING_KEYS.keyboardMode) {
      next[key] = normalizeKeyboardMode(source[key]);
      return;
    }
    if (key === SYSTEM_SETTING_KEYS.virtualKeyboardHeight) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(Math.max(Math.round(numeric), 180), 600)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }
    if (key === SYSTEM_SETTING_KEYS.bottomSheetMinHeight) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(Math.max(Math.round(numeric), 180), 720)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }
    if (key === SYSTEM_SETTING_KEYS.bottomSheetMaxHeight) {
      const numeric = Number(source[key]);
      next[key] = Number.isFinite(numeric)
        ? Math.min(Math.max(Math.round(numeric), 320), 960)
        : DEFAULT_SYSTEM_SETTINGS[key];
      return;
    }
    next[key] = Boolean(source[key]);
  });


  if (next[SYSTEM_SETTING_KEYS.platformOverride] === PLATFORM_OVERRIDE_MODES.auto) {
    next[SYSTEM_SETTING_KEYS.mobileBreakpoint] = DEFAULT_MOBILE_BREAKPOINT_PX;
  } else {
    next[SYSTEM_SETTING_KEYS.mobileBreakpoint] = FORCED_MOBILE_PLATFORM_BREAKPOINT_PX;
  }

  if (
    next[SYSTEM_SETTING_KEYS.bottomSheetMaxHeight] <
    next[SYSTEM_SETTING_KEYS.bottomSheetMinHeight]
  ) {
    next[SYSTEM_SETTING_KEYS.bottomSheetMaxHeight] =
      next[SYSTEM_SETTING_KEYS.bottomSheetMinHeight];
  }

  return next;
}
