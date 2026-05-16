/**
 * @file useViewportGuard.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {
  KEYBOARD_THRESHOLD_PX,
  MIN_VIEWPORT_HEIGHT_PX,
  MOBILE_BREAKPOINT_PX,
} from "@/constants/uiTokens";

/**
 * getViewportSize 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getViewportSize() {
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


function getMobileBrowserFamily() {
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  if (/SamsungBrowser/i.test(userAgent)) return "samsung";
  if (/Firefox/i.test(userAgent)) return "firefox";
  return "default";
}

function isTextEditingElement(element) {
  if (!element) return false;
  const tagName = element.tagName?.toLowerCase?.();
  return (
    tagName === "textarea" ||
    tagName === "input" ||
    element.isContentEditable === true
  );
}

/**
 * Calculates the virtual keyboard inset using both layout viewport and baseline values.
 * Samsung Internet, Chrome and Firefox Android report different visualViewport values,
 * so the composer uses a conservative inset while the keyboard is actually focused.
 *
 * @param {object} size Current viewport metrics.
 * @param {number} baselineHeight Largest stable viewport height seen while keyboard is closed.
 * @returns {{layoutHeight:number, keyboardHeight:number, offsetTop:number}}
 */
function getKeyboardMetrics(size, baselineHeight = 0) {
  const visualHeight = Math.max(size.height || 0, MIN_VIEWPORT_HEIGHT_PX);
  const layoutHeight = Math.max(
    baselineHeight || 0,
    size.layoutHeight || 0,
    visualHeight,
    MIN_VIEWPORT_HEIGHT_PX
  );
  const offsetTop = Math.max(size.offsetTop || 0, 0);
  const visualBottom = offsetTop + visualHeight;
  const activeElement = typeof document !== "undefined" ? document.activeElement : null;
  const hasTextFocus = isTextEditingElement(activeElement);
  const candidateFromLayout = Math.max((size.layoutHeight || 0) - visualBottom, 0);
  const candidateFromBaseline = Math.max(layoutHeight - visualBottom, 0);
  const browserFamily = getMobileBrowserFamily();
  const keyboardHeight = hasTextFocus
    ? Math.max(candidateFromLayout, candidateFromBaseline)
    : 0;
  const composerInset = hasTextFocus
    ? browserFamily === "samsung"
      ? Math.max(candidateFromLayout, candidateFromBaseline)
      : candidateFromLayout
    : 0;

  return {
    layoutHeight,
    keyboardHeight,
    composerInset,
    offsetTop,
  };
}

/**
 * Mirrors current viewport metrics to CSS variables consumed by mobile layouts.
 *
 * @param {object} size Current visual/layout viewport metrics.
 * @param {number} baselineHeight Largest known stable viewport height.
 * @returns {{keyboardHeight:number, layoutHeight:number}}
 */
function setCssViewportVars(size, baselineHeight = 0) {
  const height = Math.max(size.height || 0, MIN_VIEWPORT_HEIGHT_PX);
  const width = Math.max(size.width || 0, MIN_VIEWPORT_HEIGHT_PX);
  const {layoutHeight, keyboardHeight, composerInset, offsetTop} = getKeyboardMetrics(
    size,
    baselineHeight
  );

  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.documentElement.style.setProperty(
    "--layout-viewport-height",
    `${layoutHeight}px`
  );
  document.documentElement.style.setProperty(
    "--keyboard-height",
    `${keyboardHeight}px`
  );
  document.documentElement.style.setProperty(
    "--mobile-keyboard-inset",
    `${keyboardHeight}px`
  );
  document.documentElement.style.setProperty(
    "--composer-keyboard-inset",
    `${composerInset}px`
  );
  document.documentElement.style.setProperty(
    "--visual-viewport-offset-top",
    `${offsetTop}px`
  );
  document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);

  return {keyboardHeight, layoutHeight};
}

/**
 * Keeps the chat layout aligned with the real visible viewport.
 * Android Chrome and Android WebView resize the visual viewport when the keyboard opens.
 * This composable mirrors that size to CSS variables and exposes a keyboard-open flag.
 */
export function useViewportGuard(options = {}) {
  const onChange = options.onChange || (() => {});
  const viewportHeight = ref(0);
  const viewportWidth = ref(0);
  const keyboardOpen = ref(false);
  const baselineHeight = ref(0);
  let resizeTimer = null;

  const isCompact = computed(
    () => viewportWidth.value > 0 && viewportWidth.value <= MOBILE_BREAKPOINT_PX
  );

  /**
   * apply 처리 함수입니다.
   * @returns {void}
   */
  function apply() {
    const size = getViewportSize();
    viewportHeight.value = size.height;
    viewportWidth.value = size.width;
    const activeElement = typeof document !== "undefined" ? document.activeElement : null;
    const hasTextFocus = isTextEditingElement(activeElement);
    const stableHeight = Math.max(size.height || 0, size.layoutHeight || 0);
    if (!hasTextFocus && (!baselineHeight.value || stableHeight > baselineHeight.value)) {
      baselineHeight.value = stableHeight;
    }
    if (!baselineHeight.value) baselineHeight.value = stableHeight || size.height;

    const metrics = setCssViewportVars(size, baselineHeight.value);

    keyboardOpen.value =
      isCompact.value && metrics.keyboardHeight > KEYBOARD_THRESHOLD_PX;
    onChange({
      ...size,
      keyboardOpen: keyboardOpen.value,
      isCompact: isCompact.value,
    });
  }

  /**
   * scheduleApply 처리 함수입니다.
   * @returns {void}
   */
  function scheduleApply() {
    window.clearTimeout(resizeTimer);
    apply();
    resizeTimer = window.setTimeout(apply, 80);
  }

  onMounted(() => {
    apply();
    window.addEventListener("resize", scheduleApply, {passive: true});
    window.addEventListener("orientationchange", scheduleApply, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", scheduleApply, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", scheduleApply, {
      passive: true,
    });
    document.addEventListener("focusin", scheduleApply, {passive: true});
    document.addEventListener("focusout", scheduleApply, {passive: true});
  });

  onBeforeUnmount(() => {
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", scheduleApply);
    window.removeEventListener("orientationchange", scheduleApply);
    window.visualViewport?.removeEventListener("resize", scheduleApply);
    window.visualViewport?.removeEventListener("scroll", scheduleApply);
    document.removeEventListener("focusin", scheduleApply);
    document.removeEventListener("focusout", scheduleApply);
  });

  return {
    viewportHeight,
    viewportWidth,
    keyboardOpen,
    isCompact,
    refreshViewport: scheduleApply,
  };
}
