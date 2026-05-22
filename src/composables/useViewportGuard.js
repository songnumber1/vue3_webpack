import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useEventListener} from "@vueuse/core";
import {
  KEYBOARD_THRESHOLD_PX,
  MIN_VIEWPORT_HEIGHT_PX,
  VIEWPORT_GUARD_DELAY_MS,
} from "@/constants/uiTokens";
import {
  VIEWPORT_BROWSER_CLASSES,
  VIEWPORT_GUARD_CUSTOM_EVENT,
  VIEWPORT_GUARD_EVENTS,
} from "@/constants/viewportGuardConstants";
import {KEYBOARD_MODES} from "@/constants/systemSettings";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {getMobileBrowserFamily, getViewportSize} from "@/utils/viewport";
function applyBrowserViewportClass(browserFamily) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove(...VIEWPORT_BROWSER_CLASSES);
  body?.classList.remove(...VIEWPORT_BROWSER_CLASSES);
  const normalizedFamily = VIEWPORT_BROWSER_CLASSES.includes(
    `mobile-browser-${browserFamily}`
  )
    ? browserFamily
    : "default";
  const className = `mobile-browser-${normalizedFamily}`;
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
  const keyboardHeight = hasTextFocus
    ? Math.max(candidateFromLayout, candidateFromBaseline)
    : 0;
  const composerInset = hasTextFocus ? candidateFromLayout : 0;

  return {
    layoutHeight,
    keyboardHeight,
    composerInset,
    offsetTop,
  };
}
function setCssViewportVars(
  size,
  baselineHeight = 0,
  keyboardMode,
  resizeEnabled
) {
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
  let mounted = false;

  const isCompact = computed(
    () =>
      viewportWidth.value > 0 &&
      viewportWidth.value <= systemSettingsStore.mobileBreakpoint
  );
  function apply() {
    if (typeof window === "undefined" || typeof document === "undefined") return;
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
    window.dispatchEvent(new CustomEvent(VIEWPORT_GUARD_CUSTOM_EVENT));
  }
  function clearScheduledApply() {
    window.clearTimeout(resizeTimer);
    resizeTimer = null;
    if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = null;
  }

  function scheduleApply() {
    if (!mounted || typeof window === "undefined") return;
    clearScheduledApply();

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      apply();
    });

    resizeTimer = window.setTimeout(apply, VIEWPORT_GUARD_DELAY_MS.default);
  }

  function handleFocusOut() {
    window.setTimeout(scheduleApply, VIEWPORT_GUARD_DELAY_MS.default);
  }

  VIEWPORT_GUARD_EVENTS.forEach((eventName) => {
    useEventListener(window, eventName, scheduleApply, {passive: true});
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
  useEventListener(document, "focusout", handleFocusOut, {passive: true});

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
    mounted = true;
    apply();
  });

  onBeforeUnmount(() => {
    mounted = false;
    clearScheduledApply();
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
