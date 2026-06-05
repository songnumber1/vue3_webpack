import {
  DEFAULT_MOBILE_BREAKPOINT_PX,
  MAX_MOBILE_BREAKPOINT_PX,
  MIN_MOBILE_BREAKPOINT_PX,
} from "@/constants/systemSettings";

export function resolveCompactBreakpoint(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_MOBILE_BREAKPOINT_PX;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? Math.min(
        Math.max(Math.round(numeric), MIN_MOBILE_BREAKPOINT_PX),
        MAX_MOBILE_BREAKPOINT_PX
      )
    : DEFAULT_MOBILE_BREAKPOINT_PX;
}

export function resolveViewportInfo(baseAppInfo = {}) {
  const width = typeof window === "undefined" ? 0 : window.innerWidth;
  const height = typeof window === "undefined" ? 0 : window.innerHeight;
  const visualWidth =
    typeof window === "undefined"
      ? 0
      : Math.round(window.visualViewport?.width || 0);
  const compactWidthCandidates = [visualWidth, width].filter(
    (value) => Number.isFinite(value) && value > 0
  );
  const compactWidth = compactWidthCandidates.length
    ? Math.min(...compactWidthCandidates)
    : 0;
  const compactBreakpoint = resolveCompactBreakpoint(
    baseAppInfo.mobileBreakpoint
  );
  const isCompactViewport =
    compactWidth > 0 && compactWidth <= compactBreakpoint;

  return {
    width,
    height,
    visualWidth,
    compactWidth,
    compactBreakpoint,
    isCompactViewport,
  };
}
