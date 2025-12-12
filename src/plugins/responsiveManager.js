import { BREAKPOINTS_REM } from "@/constants/breakpoints";

function getBreakpoint(widthRem) {
  if (widthRem < BREAKPOINTS_REM.sm) return "sm";
  if (widthRem < BREAKPOINTS_REM.md) return "md";
  return "lg";
}

function getDevice(widthPx) {
  if (widthPx < 640) return "mobile";
  if (widthPx < 1024) return "tablet";
  return "desktop";
}

function applyRootAttributes(bp) {
  const root = document.documentElement;
  root.setAttribute("data-bp", bp);

  let scale = 1.0;
  if (bp === "sm") scale = 1.3;
  else if (bp === "md") scale = 1.15;
  else scale = 1.0;

  root.style.setProperty("--scale-factor", String(scale));
}

function createResponsiveManager() {
  let width = window.innerWidth;
  let height = window.innerHeight;
  let bp = getBreakpoint(width / 16);
  let device = getDevice(width);
  const subscribers = new Set();

  applyRootAttributes(bp);

  function notify() {
    const state = { width, height, device, bp };
    subscribers.forEach((fn) => fn(state));
  }

  function handleResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const nextBp = getBreakpoint(w / 16);
    const nextDevice = getDevice(w);

    if (w === width && nextBp === bp && nextDevice === device) return;

    width = w;
    height = h;
    bp = nextBp;
    device = nextDevice;

    applyRootAttributes(bp);
    notify();
  }

  window.addEventListener("resize", handleResize);

  function subscribe(callback) {
    subscribers.add(callback);
    callback({ width, height, device, bp });
    return () => subscribers.delete(callback);
  }

  function getState() {
    return { width, height, device, bp };
  }

  return {
    subscribe,
    getState
  };
}

const responsiveManager = createResponsiveManager();
export default responsiveManager;
