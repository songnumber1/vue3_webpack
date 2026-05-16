import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {
  KEYBOARD_THRESHOLD_PX,
  MIN_VIEWPORT_HEIGHT_PX,
  MOBILE_BREAKPOINT_PX,
} from "@/constants/uiTokens";
import {getMobileBrowserFamily, getViewportSize} from "@/utils/viewport";

/**
 * Applies browser-specific classes used by CSS fallback rules.
 * Firefox Android and Samsung Internet report viewport metrics differently,
 * so the fixed mobile composer uses these classes for small spacing overrides.
 *
 * @param {string} browserFamily Normalized mobile browser name.
 * @returns {void}
 */
function applyBrowserViewportClass(browserFamily) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  const classes = [
    "mobile-browser-default",
    "mobile-browser-chrome",
    "mobile-browser-firefox",
    "mobile-browser-samsung",
  ];
  root.classList.remove(...classes);
  body?.classList.remove(...classes);
  const className = `mobile-browser-${browserFamily || "default"}`;
  root.classList.add(className);
  body?.classList.add(className);
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
  const activeElement =
    typeof document !== "undefined" ? document.activeElement : null;
  const hasTextFocus = isTextEditingElement(activeElement);
  const candidateFromLayout = Math.max(
    (size.layoutHeight || 0) - visualBottom,
    0
  );
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
  const browserFamily = getMobileBrowserFamily();
  const {layoutHeight, keyboardHeight, composerInset, offsetTop} =
    getKeyboardMetrics(size, baselineHeight);
  const browserSafeBottom = browserFamily === "firefox" ? 0 : null;

  applyBrowserViewportClass(browserFamily);

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
  if (browserSafeBottom === null) {
    document.documentElement.style.removeProperty(
      "--mobile-browser-safe-bottom"
    );
  } else {
    document.documentElement.style.setProperty(
      "--mobile-browser-safe-bottom",
      `${browserSafeBottom}px`
    );
  }
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
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;
    const hasTextFocus = isTextEditingElement(activeElement);
    const stableHeight = Math.max(size.height || 0, size.layoutHeight || 0);
    if (
      !hasTextFocus &&
      (!baselineHeight.value || stableHeight > baselineHeight.value)
    ) {
      baselineHeight.value = stableHeight;
    }
    if (!baselineHeight.value)
      baselineHeight.value = stableHeight || size.height;

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
    // Samsung Internet는 visualViewport 업데이트가 150~200ms 지연되므로
    // 한 번 더 적용하여 키보드 올라올 때 레이아웃 밀림 보정
    const browserFamily = getMobileBrowserFamily();
    const delay = browserFamily === 'samsung' ? 200 : 80;
    resizeTimer = window.setTimeout(apply, delay);
  }

  // Firefox Android는 visualViewport resize 이벤트가 발생하지 않는 경우가 있어
  // window resize를 추가로 구독합니다.
  function handleWindowResize() {
    const browserFamily = getMobileBrowserFamily();
    if (browserFamily === 'firefox') {
      scheduleApply();
    }
  }

  onMounted(() => {
    apply();
    window.addEventListener("resize", scheduleApply, {passive: true});
    window.addEventListener("resize", handleWindowResize, {passive: true});
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
    window.removeEventListener("resize", handleWindowResize);
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
