// Shared breakpoint constants for the whole app (Chat + Playground + Layout)
// Keep these values in sync with CSS media queries in main.scss.

export const BP = Object.freeze({
  SM: "sm",
  MD: "md",
  LG: "lg",
});

// Width thresholds (in px)
// sm: < MD_MIN
// md: >= MD_MIN and < LG_MIN
// lg: >= LG_MIN
export const BREAKPOINTS = Object.freeze({
  MD_MIN: 768,
  LG_MIN: 1024,
});

export function resolveBreakpoint(width) {
  const w = Number(width) || 0;
  if (w < BREAKPOINTS.MD_MIN) return BP.SM;
  if (w < BREAKPOINTS.LG_MIN) return BP.MD;
  return BP.LG;
}

export function isMobileBreakpoint(bp) {
  return bp === BP.SM;
}
