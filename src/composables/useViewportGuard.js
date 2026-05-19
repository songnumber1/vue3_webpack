import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useEventListener} from "@vueuse/core";
import {
  KEYBOARD_THRESHOLD_PX,
  MIN_VIEWPORT_HEIGHT_PX,
  MOBILE_BREAKPOINT_PX,
  VIEWPORT_GUARD_DELAY_MS,
} from "@/constants/uiTokens";
import {getMobileBrowserFamily, getViewportSize} from "@/utils/viewport";
function applyBrowserViewportClass(browserFamily) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  const classes = [
    "mobile-browser-default",
    "mobile-browser-chrome",
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
function setCssViewportVars(size, baselineHeight = 0) {
  const height = Math.max(size.height || 0, MIN_VIEWPORT_HEIGHT_PX);
  const width = Math.max(size.width || 0, MIN_VIEWPORT_HEIGHT_PX);
  const browserFamily = getMobileBrowserFamily();
  const {layoutHeight, keyboardHeight, composerInset, offsetTop} =
    getKeyboardMetrics(size, baselineHeight);
  const browserSafeBottom = null;

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
export function useViewportGuard(options = {}) {
  const onChange = options.onChange || (() => {});
  const viewportHeight = ref(0);
  const viewportWidth = ref(0);
  const keyboardOpen = ref(false);
  const baselineHeight = ref(0);
  let resizeTimer = null;
  let resizeFrame = null;

  const isCompact = computed(
    () => viewportWidth.value > 0 && viewportWidth.value <= MOBILE_BREAKPOINT_PX
  );
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
  function scheduleApply() {
    window.clearTimeout(resizeTimer);
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      apply();
    });

    const browserFamily = getMobileBrowserFamily();
    const delay =
      browserFamily === "samsung"
        ? VIEWPORT_GUARD_DELAY_MS.samsung
        : VIEWPORT_GUARD_DELAY_MS.default;
    resizeTimer = window.setTimeout(apply, delay);
  }

  useEventListener(window, "resize", scheduleApply, {passive: true});
  useEventListener(window, "orientationchange", scheduleApply, {passive: true});
  if (typeof window !== "undefined" && window.visualViewport) {
    useEventListener(window.visualViewport, "resize", scheduleApply, {
      passive: true,
    });
    useEventListener(window.visualViewport, "scroll", scheduleApply, {
      passive: true,
    });
  }
  useEventListener(document, "focusin", scheduleApply, {passive: true});
  useEventListener(document, "focusout", scheduleApply, {passive: true});

  onMounted(() => {
    apply();
  });

  onBeforeUnmount(() => {
    window.clearTimeout(resizeTimer);
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  });

  return {
    viewportHeight,
    viewportWidth,
    keyboardOpen,
    isCompact,
    refreshViewport: scheduleApply,
  };
}
