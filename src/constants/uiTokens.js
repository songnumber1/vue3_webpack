/**
 * @file uiTokens.js
 * @description Shared UI token values that must stay aligned with CSS custom properties.
 */

/** Mobile breakpoint used by JavaScript viewport checks and CSS media queries. */
export const MOBILE_BREAKPOINT_PX = 900;

/** Minimum visual viewport height used to avoid broken Android WebView keyboard calculations. */
export const MIN_VIEWPORT_HEIGHT_PX = 320;

/** Difference between layout and visual viewport that is treated as a virtual keyboard. */
export const KEYBOARD_THRESHOLD_PX = 120;
