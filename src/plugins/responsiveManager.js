// src/plugins/responsiveManager.js
import { BREAKPOINTS_REM } from "@/constants/breakpoints";

/**
 * 실제 root font-size(px)를 가져온다
 * - 접근성 설정, 브라우저 zoom, 사용자 설정 반영
 */
function getRootFontSizePx() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize);
}

/**
 * viewport width(px) → rem 변환
 */
function getViewportWidthRem() {
  const rootFontSize = getRootFontSizePx();
  return window.innerWidth / rootFontSize;
}

function getBreakpoint(widthRem) {
  if (widthRem < BREAKPOINTS_REM.sm) return "sm";
  if (widthRem < BREAKPOINTS_REM.md) return "md";
  return "lg";
}

/**
 * device도 rem 기준으로 통일
 */
function getDevice(widthRem) {
  if (widthRem < 40) return "mobile"; // 40rem
  if (widthRem < 64) return "tablet"; // 64rem
  return "desktop";
}

function applyRootAttributes(bp) {
  const root = document.documentElement;
  root.setAttribute("data-bp", bp);

  /**
   * breakpoint → typography scale
   * rem 기반이므로 html font-size 조절이 자연스럽다
   */
  let scale = 1.0;
  if (bp === "sm") scale = 1.3;
  else if (bp === "md") scale = 1.15;

  root.style.setProperty("--scale-factor", String(scale));
}

function createResponsiveManager() {
  let rootFontSizePx = getRootFontSizePx();
  let widthRem = getViewportWidthRem();
  let heightPx = window.innerHeight;

  let bp = getBreakpoint(widthRem);
  let device = getDevice(widthRem);

  const subscribers = new Set();

  applyRootAttributes(bp);

  function notify() {
    subscribers.forEach((fn) =>
      fn({
        widthRem,
        heightPx,
        rootFontSizePx,
        device,
        bp,
      })
    );
  }

  function handleResize() {
    const nextRootFontSizePx = getRootFontSizePx();
    const nextWidthRem = getViewportWidthRem();
    const nextHeightPx = window.innerHeight;

    const nextBp = getBreakpoint(nextWidthRem);
    const nextDevice = getDevice(nextWidthRem);

    if (
      nextRootFontSizePx === rootFontSizePx &&
      nextWidthRem === widthRem &&
      nextBp === bp &&
      nextDevice === device
    ) {
      return;
    }

    rootFontSizePx = nextRootFontSizePx;
    widthRem = nextWidthRem;
    heightPx = nextHeightPx;
    bp = nextBp;
    device = nextDevice;

    applyRootAttributes(bp);
    notify();
  }

  window.addEventListener("resize", handleResize);

  /**
   * font-size 변경(접근성/OS 설정)도 감지
   */
  const fontSizeObserver = new ResizeObserver(handleResize);
  fontSizeObserver.observe(document.documentElement);

  function subscribe(callback) {
    subscribers.add(callback);
    callback({
      widthRem,
      heightPx,
      rootFontSizePx,
      device,
      bp,
    });
    return () => subscribers.delete(callback);
  }

  function getState() {
    return {
      widthRem,
      heightPx,
      rootFontSizePx,
      device,
      bp,
    };
  }

  return {
    subscribe,
    getState,
  };
}

const responsiveManager = createResponsiveManager();
export default responsiveManager;
