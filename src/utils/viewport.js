import {MOBILE_BREAKPOINT_PX} from "@/constants/uiTokens";

export const DEFAULT_MOBILE_BREAKPOINT_PX = MOBILE_BREAKPOINT_PX;
export function getMobileBrowserFamily() {
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
  if (/SamsungBrowser/i.test(userAgent)) return "samsung";
  if (/Firefox/i.test(userAgent)) return "firefox";
  if (/Chrome|CriOS|Chromium/i.test(userAgent)) return "chrome";

  return "default";
}
export function getViewportSize() {
  const visualViewport =
    typeof window !== "undefined" ? window.visualViewport : null;

  return {
    width: Math.round(visualViewport?.width || window.innerWidth || 0),
    height: Math.round(visualViewport?.height || window.innerHeight || 0),
    layoutWidth: Math.round(window.innerWidth || visualViewport?.width || 0),
    layoutHeight: Math.round(window.innerHeight || visualViewport?.height || 0),
    offsetTop: Math.round(visualViewport?.offsetTop || 0),
  };
}
export function isMobileViewport(breakpoint = DEFAULT_MOBILE_BREAKPOINT_PX) {
  if (typeof window === "undefined") return false;
  const width = Math.min(
    window.visualViewport?.width || window.innerWidth || 0,
    window.innerWidth || window.visualViewport?.width || 0
  );

  return width > 0 && width <= breakpoint;
}
export function readRootPixelVar(name) {
  if (typeof document === "undefined") return 0;
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name);
  const parsed = Number.parseFloat(value || "0");

  return Number.isFinite(parsed) ? parsed : 0;
}
export function getViewportHeight({minHeight = 320, fallback = 720} = {}) {
  if (typeof window === "undefined") return fallback;

  const visualHeight = Math.round(window.visualViewport?.height || 0);
  const innerHeight = Math.round(window.innerHeight || 0);
  const clientHeight = Math.round(document.documentElement?.clientHeight || 0);
  const appHeight = Math.round(readRootPixelVar("--app-height") || 0);
  const candidates = [
    visualHeight,
    innerHeight,
    clientHeight,
    appHeight,
  ].filter((height) => Number.isFinite(height) && height >= minHeight);

  if (!candidates.length) return fallback;
  if (isMobileViewport() && getMobileBrowserFamily() === "firefox") {
    return Math.max(Math.min(...candidates), minHeight);
  }
  if (isMobileViewport() && visualHeight > 0) {
    return Math.max(visualHeight, minHeight);
  }

  return Math.max(innerHeight || visualHeight || clientHeight, minHeight);
}
export function getSafeAreaBottom() {
  if (typeof window === "undefined" || typeof document === "undefined")
    return 0;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;bottom:env(safe-area-inset-bottom);height:0;visibility:hidden;";
  document.body.appendChild(probe);
  const value = Math.max(
    0,
    Math.round(window.innerHeight - probe.getBoundingClientRect().bottom)
  );
  probe.remove();

  return Number.isFinite(value) ? value : 0;
}
