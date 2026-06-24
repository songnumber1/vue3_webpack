/**
 * @file platform/viewport/viewportCssVars.js
 * @description 브라우저 viewport, VisualViewport, 모바일 키보드, safe-area 관련 런타임 보정 모듈입니다.
 */

let viewportCssVarsInstalled = false;

/**
 * 현재 상태를 기준으로 reactive 값 또는 DOM 보조 값을 갱신합니다.
 */
function updateViewportCssVars() {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const viewport = window.visualViewport;
  const height = Math.max(
    Math.round(viewport?.height || window.innerHeight || 0),
    320
  );
  const width = Math.max(
    Math.round(viewport?.width || window.innerWidth || 0),
    320
  );

  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
}

export function installViewportCssVars() {
  updateViewportCssVars();

  if (viewportCssVarsInstalled) return;
  viewportCssVarsInstalled = true;

  window.addEventListener("resize", updateViewportCssVars, {passive: true});
  window.addEventListener("orientationchange", updateViewportCssVars, {
    passive: true,
  });
}
