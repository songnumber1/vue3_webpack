let viewportCssVarsInstalled = false;

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
