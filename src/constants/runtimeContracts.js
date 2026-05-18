export const RUNTIME_CSS_VARS = Object.freeze({
  appHeight: "--app-height",
  appWidth: "--app-width",
  layoutViewportHeight: "--layout-viewport-height",
  keyboardHeight: "--keyboard-height",
  mobileKeyboardInset: "--mobile-keyboard-inset",
  composerKeyboardInset: "--composer-keyboard-inset",
  firefoxMainComposerBottom: "--firefox-main-composer-bottom",
  visualViewportOffsetTop: "--visual-viewport-offset-top",
  mobileBrowserSafeBottom: "--mobile-browser-safe-bottom",
  vh: "--vh",
  viewportModeBreakpoint: "--viewport-mode-breakpoint",
});

export const VIEWPORT_MODE_CLASSES = Object.freeze({
  mobile: "mobile-mode",
  desktop: "desktop-mode",
});

export const VIEWPORT_MODE_DATASET_KEY = "viewportMode";

export const MOBILE_BROWSER_CLASS_PREFIX = "mobile-browser";

export const MOBILE_BROWSER_CLASSES = Object.freeze([
  "mobile-browser-default",
  "mobile-browser-chrome",
  "mobile-browser-firefox",
  "mobile-browser-samsung",
]);

export const MOBILE_BROWSER_FAMILY = Object.freeze({
  default: "default",
  chrome: "chrome",
  firefox: "firefox",
  samsung: "samsung",
});
