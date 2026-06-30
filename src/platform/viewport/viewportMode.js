/**
 * @file platform/viewport/viewportMode.js
 * @description 모바일 전용 앱의 viewport mode class를 고정합니다.
 */

const MOBILE_VIEWPORT_MODE = "mobile";

export function isMobileLikeViewport() {
  return true;
}

export function syncViewportModeClass() {
  if (typeof document === "undefined") return true;
  const {body} = document;
  if (!body) return true;

  body.classList.add("mobile-mode");
  body.dataset.viewportMode = MOBILE_VIEWPORT_MODE;

  return true;
}

export function installViewportModeClass() {
  syncViewportModeClass();
  return () => {};
}
