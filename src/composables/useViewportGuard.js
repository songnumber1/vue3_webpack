/**
 * @file useViewportGuard.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { computed, onBeforeUnmount, onMounted, ref } from "vue";
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
  };
}

/**
 * setCssViewportVars 처리 함수입니다.
 * @param {*} size 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function setCssViewportVars(size, baselineHeight = 0) {
  const height = Math.max(size.height || 0, MIN_VIEWPORT_HEIGHT_PX);
  const width = Math.max(size.width || 0, MIN_VIEWPORT_HEIGHT_PX);
  const layoutHeight = Math.max(baselineHeight || height, height, MIN_VIEWPORT_HEIGHT_PX);
  const keyboardHeight = Math.max(layoutHeight - height, 0);
  const offsetTop = Math.max(window.visualViewport?.offsetTop || 0, 0);

  document.documentElement.style.setProperty("--app-height", `${height}px`);
  document.documentElement.style.setProperty("--app-width", `${width}px`);
  document.documentElement.style.setProperty("--layout-viewport-height", `${layoutHeight}px`);
  document.documentElement.style.setProperty("--keyboard-height", `${keyboardHeight}px`);
  document.documentElement.style.setProperty("--visual-viewport-offset-top", `${offsetTop}px`);
  document.documentElement.style.setProperty("--vh", `${height * 0.01}px`);
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
    () => viewportWidth.value > 0 && viewportWidth.value <= MOBILE_BREAKPOINT_PX,
  );

  /**
   * apply 처리 함수입니다.
   * @returns {void}
   */
  function apply() {
    const size = getViewportSize();
    viewportHeight.value = size.height;
    viewportWidth.value = size.width;
    if (!baselineHeight.value || size.height > baselineHeight.value) {
      baselineHeight.value = size.height;
    }

    setCssViewportVars(size, baselineHeight.value);

    keyboardOpen.value =
      isCompact.value &&
      baselineHeight.value - size.height > KEYBOARD_THRESHOLD_PX;
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
    window.addEventListener("resize", scheduleApply, { passive: true });
    window.addEventListener("orientationchange", scheduleApply, {
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", scheduleApply, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", scheduleApply, {
      passive: true,
    });
  });

  onBeforeUnmount(() => {
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", scheduleApply);
    window.removeEventListener("orientationchange", scheduleApply);
    window.visualViewport?.removeEventListener("resize", scheduleApply);
    window.visualViewport?.removeEventListener("scroll", scheduleApply);
  });

  return {
    viewportHeight,
    viewportWidth,
    keyboardOpen,
    isCompact,
    refreshViewport: scheduleApply,
  };
}
