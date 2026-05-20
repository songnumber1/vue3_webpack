import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useEventListener} from "@vueuse/core";
import {
  KEYBOARD_THRESHOLD_PX,
  MIN_VIEWPORT_HEIGHT_PX,
  VIEWPORT_GUARD_DELAY_MS,
} from "@/constants/uiTokens";
import {KEYBOARD_MODES} from "@/constants/systemSettings";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
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
function setCssViewportVars(size, baselineHeight = 0, keyboardMode, resizeEnabled) {
  const height = Math.max(size.height || 0, MIN_VIEWPORT_HEIGHT_PX);
  const width = Math.max(size.width || 0, MIN_VIEWPORT_HEIGHT_PX);
  const browserFamily = getMobileBrowserFamily();
  const rawMetrics = getKeyboardMetrics(size, baselineHeight);
  const isResizeMode =
    keyboardMode === KEYBOARD_MODES.adjustResize && resizeEnabled;
  const layoutHeight = rawMetrics.layoutHeight;
  const keyboardHeight = isResizeMode ? rawMetrics.keyboardHeight : 0;
  const composerInset = isResizeMode ? rawMetrics.composerInset : 0;
  const offsetTop = rawMetrics.offsetTop;
  const browserSafeBottom = null;

  applyBrowserViewportClass(browserFamily);

  document.documentElement.dataset.keyboardMode = keyboardMode;
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

  return {
    keyboardHeight,
    layoutHeight,
    rawKeyboardHeight: rawMetrics.keyboardHeight,
  };
}
function panFocusedElementIntoView() {
  if (typeof document === "undefined") return;
  const activeElement = document.activeElement;
  if (!isTextEditingElement(activeElement)) return;

  window.requestAnimationFrame(() => {
    activeElement.scrollIntoView?.({
      block: "center",
      inline: "nearest",
      behavior: "smooth",
    });
  });
}
function removeKeyboardModeVars() {
  if (typeof document === "undefined") return;
  document.documentElement.removeAttribute("data-keyboard-mode");
}

export function useViewportGuard(options = {}) {
  const onChange = options.onChange || (() => {});
  const systemSettingsStore = useSystemSettingsStore();
  const viewportHeight = ref(0);
  const viewportWidth = ref(0);
  const keyboardOpen = ref(false);
  const baselineHeight = ref(0);
  let resizeTimer = null;
  let resizeFrame = null;

  const isCompact = computed(
    () =>
      viewportWidth.value > 0 &&
      viewportWidth.value <= systemSettingsStore.mobileBreakpoint
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

    const keyboardMode = systemSettingsStore.keyboardMode;
    const metrics = setCssViewportVars(
      size,
      baselineHeight.value,
      keyboardMode,
      systemSettingsStore.useVirtualKeyboard
    );

    if (keyboardMode === KEYBOARD_MODES.adjustPan && isCompact.value) {
      panFocusedElementIntoView();
    }

    keyboardOpen.value =
      keyboardMode === KEYBOARD_MODES.adjustResize &&
      systemSettingsStore.useVirtualKeyboard &&
      isCompact.value &&
      metrics.keyboardHeight > KEYBOARD_THRESHOLD_PX;
    onChange({
      ...size,
      keyboardOpen: keyboardOpen.value,
      isCompact: isCompact.value,
    });
    window.dispatchEvent(new CustomEvent("viewportguard:applied"));
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
  useEventListener(window, "virtual-keyboard-debug:changed", scheduleApply, {
    passive: true,
  });
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

  watch(
    () => [
      systemSettingsStore.keyboardMode,
      systemSettingsStore.useVirtualKeyboard,
      systemSettingsStore.mobileBreakpoint,
    ],
    scheduleApply,
    {flush: "post"}
  );

  onMounted(() => {
    apply();
  });

  onBeforeUnmount(() => {
    window.clearTimeout(resizeTimer);
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
    removeKeyboardModeVars();
  });

  return {
    viewportHeight,
    viewportWidth,
    keyboardOpen,
    isCompact,
    refreshViewport: scheduleApply,
  };
}
