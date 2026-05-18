import {MOBILE_BREAKPOINT_PX} from "@/constants/uiTokens";
import {
  RUNTIME_CSS_VARS,
  VIEWPORT_MODE_CLASSES,
  VIEWPORT_MODE_DATASET_KEY,
} from "@/constants/runtimeContracts";

let cleanupViewportModeListeners = null;

/**
 * @description visualViewport가 있으면 키보드/모바일 브라우저 보정값을 우선 사용하고,
 * 없으면 layout viewport 기준으로 현재 화면 너비를 반환합니다.
 * @returns {number} 현재 viewport 너비입니다.
 */
function getViewportModeWidth() {
  if (typeof window === "undefined") return 0;
  const visualWidth = Math.round(window.visualViewport?.width || 0);
  const layoutWidth = Math.round(window.innerWidth || 0);
  const candidates = [visualWidth, layoutWidth].filter(
    (width) => Number.isFinite(width) && width > 0
  );

  return candidates.length ? Math.min(...candidates) : 0;
}

/**
 * @description body에 mobile-mode/desktop-mode 클래스를 반영합니다.
 * CSS는 이 클래스를 기준으로 모바일/웹 분기를 적용합니다.
 * @param {number} breakpoint - 모바일 전환 기준 너비입니다.
 * @returns {boolean} 모바일 모드 여부입니다.
 */
export function syncViewportModeClass(breakpoint = MOBILE_BREAKPOINT_PX) {
  if (typeof document === "undefined") return false;
  const width = getViewportModeWidth();
  const isMobile = width > 0 && width <= breakpoint;
  const {body} = document;

  if (!body) return isMobile;
  body.classList.toggle(VIEWPORT_MODE_CLASSES.mobile, isMobile);
  body.classList.toggle(VIEWPORT_MODE_CLASSES.desktop, !isMobile);
  body.dataset[VIEWPORT_MODE_DATASET_KEY] = isMobile ? "mobile" : "desktop";
  body.style.setProperty(RUNTIME_CSS_VARS.viewportModeBreakpoint, `${breakpoint}px`);

  return isMobile;
}

/**
 * @description viewport 변경 시 body viewport mode 클래스를 자동 갱신합니다.
 * @param {number} breakpoint - 모바일 전환 기준 너비입니다.
 * @returns {Function} 이벤트 리스너 해제 함수입니다.
 */
export function installViewportModeClass(breakpoint = MOBILE_BREAKPOINT_PX) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  if (cleanupViewportModeListeners) {
    cleanupViewportModeListeners();
  }

  const sync = () => syncViewportModeClass(breakpoint);
  sync();

  window.addEventListener("resize", sync, {passive: true});
  window.addEventListener("orientationchange", sync, {passive: true});
  window.visualViewport?.addEventListener("resize", sync, {passive: true});

  cleanupViewportModeListeners = () => {
    window.removeEventListener("resize", sync);
    window.removeEventListener("orientationchange", sync);
    window.visualViewport?.removeEventListener("resize", sync);
    cleanupViewportModeListeners = null;
  };

  return cleanupViewportModeListeners;
}
