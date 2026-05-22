export const VIEWPORT_BROWSER_CLASSES = Object.freeze([
  "mobile-browser-default",
  "mobile-browser-chrome",
]);

export const VIEWPORT_GUARD_EVENTS = Object.freeze([
  "resize",
  "orientationchange",
  "pageshow",
  "visibilitychange",
  "virtual-keyboard-debug:changed",
]);

export const VIEWPORT_GUARD_CUSTOM_EVENT = "viewportguard:applied";

export const BOTTOM_SHEET_REFRESH_EVENTS = Object.freeze([
  "resize",
  "orientationchange",
  VIEWPORT_GUARD_CUSTOM_EVENT,
]);
