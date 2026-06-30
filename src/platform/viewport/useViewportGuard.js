/**
 * @file platform/viewport/useViewportGuard.js
 * @description 브라우저 viewport, VisualViewport, 모바일 키보드, safe-area 관련 런타임 보정 모듈입니다.
 */

import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {useEventListener} from "@vueuse/core";
import {
  KEYBOARD_THRESHOLD_PX,
  MIN_VIEWPORT_HEIGHT_PX,
  VIEWPORT_BROWSER_CLASSES,
  VIEWPORT_GUARD_CUSTOM_EVENT,
  VIEWPORT_GUARD_DELAY_MS,
  VIEWPORT_GUARD_EVENTS,
} from "@/platform/viewport/viewportConstants";
import {
  getMobileBrowserFamily,
  getViewportSize,
} from "@/platform/viewport/viewport";

const VIEWPORT_KEYBOARD_MODE = "adjustResize";
const USE_VIRTUAL_KEYBOARD = true;
/**
 * [Viewport/Keyboard Guard]
 * 모바일 브라우저는 주소창, 키보드, WebView resize 정책에 따라 innerHeight와 visualViewport 값이 다르게 변합니다.
 * 이 composable은 그 차이를 CSS 변수로 정규화하고 body/html class를 갱신해 CSS patch가 같은 기준을 보도록 합니다.
 *
 * 특히 전송 직후 키보드가 내려가는 동안 scroll 보정이 먼저 실행되면 질문 앵커 위치가 틀어질 수 있으므로,
 * viewport refresh 이벤트와 delayed resize 처리를 통해 안정화 시점을 확보합니다.
 */
/**
 * 현재 모바일 브라우저 계열을 html/body class에 반영합니다.
 * CSS patch는 지원 대상인 Chrome/WebView 기준 class만 반영합니다.
 */
function applyBrowserViewportClass(browserFamily) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const body = document.body;
  root.classList.remove(...VIEWPORT_BROWSER_CLASSES);
  body?.classList.remove(...VIEWPORT_BROWSER_CLASSES);
  const className = VIEWPORT_BROWSER_CLASSES.includes(
    `mobile-browser-${browserFamily}`
  )
    ? `mobile-browser-${browserFamily}`
    : "mobile-browser-chrome";
  root.classList.add(className);
  body?.classList.add(className);
}
/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
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
 * VisualViewport 값과 layout viewport 기준 높이를 비교해 키보드 높이를 계산합니다.
 *
 * 모바일 브라우저는 키보드가 열릴 때 visualViewport.height만 줄어드는 경우가 많고,
 * 일부 브라우저는 offsetTop도 같이 변합니다. baselineHeight는 키보드가 닫힌 안정 높이로
 * 사용해 false positive를 줄입니다.
 */
/**
 * 현재 DOM, store, runtime 값에서 필요한 값을 조회합니다.
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
/**
 * viewport/keyboard 값을 CSS custom property로 내려줍니다.
 *
 * 레이아웃 CSS는 JS 상태를 직접 읽지 않고 아래 변수만 참조합니다.
 * - --app-height / --app-width
 * - --layout-viewport-height
 * - --keyboard-height / --composer-keyboard-inset
 * - --visual-viewport-offset-top
 */
/**
 * store, DOM CSS 변수 또는 reactive 상태에 값을 반영합니다.
 */
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
    keyboardMode === "adjustResize" && resizeEnabled;
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
/**
 * adjustPan 모드에서 키보드가 input을 가릴 때 현재 포커스 요소를 화면 중앙으로 이동합니다.
 * adjustResize 모드에서는 CSS inset으로 처리하므로 이 함수를 사용하지 않습니다.
 */
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

/**
 * 모바일 viewport와 가상 키보드 상태를 감시하는 앱 전역 guard입니다.
 *
 * 핵심 역할:
 * 1. resize/orientation/visualViewport/focus 이벤트를 한 곳에서 수집합니다.
 * 2. 모바일 keyboard mode에 맞춰 CSS 변수를 갱신합니다.
 * 3. composer, bottom sheet, chat layout이 동일한 viewport 기준을 사용하게 합니다.
 *
 * @param {{onChange?: Function}} options viewport 변경 콜백
 * @returns {{viewportHeight: import('vue').Ref<number>, viewportWidth: import('vue').Ref<number>, keyboardOpen: import('vue').Ref<boolean>, isCompact: import('vue').ComputedRef<boolean>, refreshViewport: Function}}
 */
export function useViewportGuard(options = {}) {
  const onChange = options.onChange || (() => {});
  const viewportHeight = ref(0);
  const viewportWidth = ref(0);
  const keyboardOpen = ref(false);
  const baselineHeight = ref(0);
  let resizeTimer = null;
  let resizeFrame = null;
  let mounted = false;

  const isCompact = computed(() => true);
  // 실제 viewport 측정과 CSS 변수 반영을 수행하는 단일 진입점입니다.
  function apply() {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    const size = getViewportSize();
    viewportHeight.value = size.height;
    viewportWidth.value = size.width;
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;
    const hasTextFocus = isTextEditingElement(activeElement);
    const stableHeight = Math.max(size.height || 0, size.layoutHeight || 0);
    // 텍스트 입력 중이 아닐 때만 baseline을 갱신해 키보드 열린 높이를 안정 높이로 오인하지 않게 합니다.
    if (
      !hasTextFocus &&
      (!baselineHeight.value || stableHeight > baselineHeight.value)
    ) {
      baselineHeight.value = stableHeight;
    }
    if (!baselineHeight.value)
      baselineHeight.value = stableHeight || size.height;

    const keyboardMode = VIEWPORT_KEYBOARD_MODE;
    const metrics = setCssViewportVars(
      size,
      baselineHeight.value,
      keyboardMode,
      USE_VIRTUAL_KEYBOARD
    );

    if (keyboardMode === "adjustPan" && isCompact.value) {
      panFocusedElementIntoView();
    }

    keyboardOpen.value =
      keyboardMode === "adjustResize" &&
      USE_VIRTUAL_KEYBOARD &&
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

  // 연속 resize 이벤트를 requestAnimationFrame + timeout으로 합쳐 과도한 DOM write를 줄입니다.
  function scheduleApply() {
    if (!mounted || typeof window === "undefined") return;
    clearScheduledApply();

    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = null;
      apply();
    });

    resizeTimer = window.setTimeout(apply, VIEWPORT_GUARD_DELAY_MS.default);
  }

  // focusout 직후 visualViewport 값이 늦게 복구되는 브라우저가 있어 한 번 지연 갱신합니다.
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
