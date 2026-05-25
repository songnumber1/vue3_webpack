/**
 * @file platform/viewport/viewportCssVars.js
 * @description 브라우저 viewport, VisualViewport, 모바일 키보드, safe-area 관련 런타임 보정 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

let viewportCssVarsInstalled = false;

/**
 * 현재 상태를 기준으로 reactive 값 또는 DOM 보조 값을 갱신합니다.
 */
function updateViewportCssVars() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const viewport = window.visualViewport;
  const height = Math.max(Math.round(viewport?.height || window.innerHeight || 0), 320);
  const width = Math.max(Math.round(viewport?.width || window.innerWidth || 0), 320);

  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
}

export function installViewportCssVars() {
  updateViewportCssVars();

  if (viewportCssVarsInstalled) return;
  viewportCssVarsInstalled = true;

  window.addEventListener("resize", updateViewportCssVars, {passive: true});
  window.addEventListener("orientationchange", updateViewportCssVars, {passive: true});
}
