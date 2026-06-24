/**
 * @file platform/viewport/viewportConstants.js
 * @description 브라우저 viewport, VisualViewport, 모바일 키보드, safe-area 관련 런타임 보정 모듈입니다.
 */

export const MOBILE_BREAKPOINT_PX =
  process.env.VUE_APP_SYSTEM_MOBILE_BREAKPOINT;

export const MIN_VIEWPORT_HEIGHT_PX = 320;

export const KEYBOARD_THRESHOLD_PX = 120;

export const BOTTOM_SHEET_VIEWPORT_REFRESH_DELAY_MS = 60;

export const BOTTOM_SHEET_SNAP_RATIO = Object.freeze({
  half: 0.58,
  contentDefault: 0.72,
  fullThreshold: 0.82,
  expandThreshold: 0.76,
  closeThreshold: 0.82,
});

export const VIEWPORT_GUARD_DELAY_MS = Object.freeze({
  default: 80,
});
export const VIEWPORT_BROWSER_CLASSES = Object.freeze([
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
