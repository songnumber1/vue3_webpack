/**
 * @file composables/ui/useOverlayKeyboardScrollController.js
 * @description
 * Android Chrome/WebView + OverlayScrollbars keyboard focus stabilizer.
 *
 * 이 composable은 아직 화면 구조를 바꾸지 않고, 다음 단계에서 Studio 만들기/수정
 * 화면의 textarea/input 보정 로직을 옮길 수 있도록 기준 controller만 제공합니다.
 * 실제 스크롤 보정은 window/body가 아니라 전달받은 OverlayScrollbars viewport에만
 * 수행합니다.
 */

import {nextTick, onBeforeUnmount, unref} from "vue";

const DEFAULT_DELAYS = [0, 40, 90, 160, 260, 420, 620];
const DEFAULT_EDGE_PADDING = Object.freeze({top: 14, bottom: 28});
const DEFAULT_FIELD_SELECTOR = "label, fieldset";
const DEFAULT_EDITABLE_SELECTOR =
  "input, textarea, select, [contenteditable='true']";
const DEFAULT_TEXTAREA_TOP_SENTINEL = 12;
const MIN_SCROLL_DELTA = 3;

function isClient() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isHTMLElement(element) {
  return typeof HTMLElement !== "undefined" && element instanceof HTMLElement;
}

function resolveMaybeRef(source) {
  if (typeof source === "function") return source();
  return unref(source);
}

function readNumber(value, fallback) {
  const resolved = resolveMaybeRef(value);
  return Number.isFinite(Number(resolved)) ? Number(resolved) : fallback;
}

function resolveViewport(source) {
  const value = resolveMaybeRef(source);
  if (!value) return null;
  if (typeof value.getViewport === "function") return value.getViewport();
  if (isHTMLElement(value)) return value;
  if (isHTMLElement(value.$el)) return value.$el;
  return null;
}

function isEditableElement(element, selector = DEFAULT_EDITABLE_SELECTOR) {
  return isHTMLElement(element) && Boolean(element.matches?.(selector));
}

function isTextareaElement(element) {
  return isHTMLElement(element) && element.tagName === "TEXTAREA";
}

function getMeasureTarget(element, fieldSelector) {
  if (!isHTMLElement(element)) return null;
  return element.closest?.(fieldSelector || DEFAULT_FIELD_SELECTOR) || element;
}

function getVisibleBounds(viewport, options) {
  const viewportRect = viewport.getBoundingClientRect();
  const visualViewport = window.visualViewport;
  const visualTop = Math.round(visualViewport?.offsetTop || 0);
  const visualHeight = Math.round(
    visualViewport?.height || window.innerHeight || viewportRect.bottom
  );
  const top = Math.max(viewportRect.top, visualTop);
  const bottom = Math.min(viewportRect.bottom, visualTop + visualHeight);

  return {
    top: top + readNumber(options.edgePaddingTop, DEFAULT_EDGE_PADDING.top),
    bottom:
      bottom -
      readNumber(options.edgePaddingBottom, DEFAULT_EDGE_PADDING.bottom),
  };
}

/**
 * OverlayScrollbars viewport 기준으로 Android keyboard focus 보정을 수행합니다.
 *
 * @param {Object} options
 * @param {boolean|import('vue').Ref<boolean>|Function} [options.enabled=true]
 * @param {HTMLElement|import('vue').Ref<HTMLElement>|Function|Object} options.viewport
 *   HTMLElement, ref, function, 또는 getViewport()를 가진 OverlayScrollbars adapter.
 * @param {Function} [options.updateOverlay]
 *   OverlayScrollbars instance update 함수. 보정 전후로 호출됩니다.
 * @param {boolean} [options.restoreDocumentScroll=true]
 *   Android가 body/document를 움직였을 때 다시 0으로 복구할지 여부.
 * @param {boolean} [options.textareaTopSentinel=true]
 *   상단 textarea focus 시 내부 viewport를 작은 sentinel 위치로 고정할지 여부.
 * @param {number} [options.textareaTopScrollSentinel=12]
 * @param {string} [options.fieldSelector='label, fieldset']
 * @param {string} [options.editableSelector]
 * @param {number[]} [options.delays]
 * @param {number} [options.edgePaddingTop=14]
 * @param {number} [options.edgePaddingBottom=28]
 * @returns {{handleFocusIn: Function, handleFocusOut: Function, handlePointerDown: Function, scheduleCorrection: Function, runCorrection: Function, clear: Function, getViewport: Function}}
 */
export function useOverlayKeyboardScrollController(options = {}) {
  const controllerOptions = {
    enabled: true,
    viewport: null,
    updateOverlay: null,
    restoreDocumentScroll: true,
    textareaTopSentinel: true,
    textareaTopScrollSentinel: DEFAULT_TEXTAREA_TOP_SENTINEL,
    fieldSelector: DEFAULT_FIELD_SELECTOR,
    editableSelector: DEFAULT_EDITABLE_SELECTOR,
    delays: DEFAULT_DELAYS,
    edgePaddingTop: DEFAULT_EDGE_PADDING.top,
    edgePaddingBottom: DEFAULT_EDGE_PADDING.bottom,
    ...options,
  };

  let focusedElement = null;
  let focusState = null;
  let timers = [];

  function isEnabled() {
    return resolveMaybeRef(controllerOptions.enabled) !== false;
  }

  function getViewport() {
    return resolveViewport(controllerOptions.viewport);
  }

  function updateOverlay() {
    const update = resolveMaybeRef(controllerOptions.updateOverlay);
    if (typeof update === "function") update();
  }

  function clearTimers() {
    if (!isClient()) return;
    timers.forEach((timer) => window.clearTimeout(timer));
    timers = [];
  }

  function clear() {
    focusedElement = null;
    focusState = null;
    clearTimers();
    unbindViewportListeners();
  }

  function restoreDocumentScrollPosition() {
    if (
      !isClient() ||
      resolveMaybeRef(controllerOptions.restoreDocumentScroll) === false
    ) {
      return;
    }

    if (window.scrollX !== 0 || window.scrollY !== 0) {
      window.scrollTo({top: 0, left: 0, behavior: "auto"});
    }
    if (document.documentElement?.scrollTop) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body?.scrollTop) {
      document.body.scrollTop = 0;
    }
  }

  function primeTextareaFocusScroll(textarea) {
    if (!isClient() || !isEnabled()) return;
    if (!isTextareaElement(textarea)) return;
    if (resolveMaybeRef(controllerOptions.textareaTopSentinel) === false)
      return;

    const viewport = getViewport();
    if (!viewport) return;

    restoreDocumentScrollPosition();
    updateOverlay();

    const sentinel = readNumber(
      controllerOptions.textareaTopScrollSentinel,
      DEFAULT_TEXTAREA_TOP_SENTINEL
    );
    const currentScrollTop = Math.max(0, viewport.scrollTop || 0);
    const lockTopScroll = currentScrollTop <= sentinel;

    if (lockTopScroll) {
      viewport.scrollTop = sentinel;
      updateOverlay();
    }

    focusState = {
      element: textarea,
      scrollTop: lockTopScroll ? sentinel : currentScrollTop,
      lockTopScroll,
    };
  }

  function restoreTextareaTopFocusScroll(element) {
    const viewport = getViewport();
    const state = focusState;
    if (!viewport || !state || state.element !== element) return;

    if (state.lockTopScroll && viewport.scrollTop > state.scrollTop + 2) {
      viewport.scrollTop = state.scrollTop;
      updateOverlay();
    }
  }

  function ensureFocusedElementVisible(element) {
    if (!isClient() || !isEnabled()) return;

    const target = element || focusedElement;
    const viewport = getViewport();
    if (!isHTMLElement(target) || !viewport) return;

    const field = getMeasureTarget(target, controllerOptions.fieldSelector);
    if (!isHTMLElement(field)) return;

    const bounds = getVisibleBounds(viewport, controllerOptions);
    const fieldRect = field.getBoundingClientRect();
    let delta = 0;

    if (fieldRect.bottom > bounds.bottom) {
      delta = fieldRect.bottom - bounds.bottom;
    } else if (!isTextareaElement(target) && fieldRect.top < bounds.top) {
      // Top textarea는 Android native visualViewport 보정과 충돌하기 쉬우므로
      // 위쪽 자동 정렬을 하지 않고 sentinel 복구만 수행합니다.
      delta = fieldRect.top - bounds.top;
    }

    if (Math.abs(delta) > MIN_SCROLL_DELTA) {
      viewport.scrollBy?.({top: delta, left: 0, behavior: "auto"});
      updateOverlay();
    }
  }

  function runCorrection(element = focusedElement) {
    if (!isClient() || !isEnabled()) return;
    if (!element || element !== focusedElement) return;

    updateOverlay();
    restoreDocumentScrollPosition();
    if (isTextareaElement(element)) {
      restoreTextareaTopFocusScroll(element);
    }
    ensureFocusedElementVisible(element);
  }

  function scheduleCorrection(element = focusedElement) {
    if (!isClient() || !isEnabled() || !element) return;
    clearTimers();

    const delays = Array.isArray(controllerOptions.delays)
      ? controllerOptions.delays
      : DEFAULT_DELAYS;
    timers = delays.map((delay) =>
      window.setTimeout(() => runCorrection(element), delay)
    );
  }

  function handlePointerDown(event) {
    const target = event?.target;
    if (isTextareaElement(target)) {
      primeTextareaFocusScroll(target);
    }
  }

  function handleFocusIn(event) {
    const target = event?.target;
    if (!isEnabled()) return;

    if (!isEditableElement(target, controllerOptions.editableSelector)) {
      return;
    }

    bindViewportListeners();
    focusedElement = target;
    if (isTextareaElement(target) && !focusState) {
      primeTextareaFocusScroll(target);
    }
    nextTick(() => scheduleCorrection(target));
  }

  function handleFocusOut(event) {
    if (event?.target === focusedElement) {
      clear();
    }
  }

  const handleViewportChange = () => scheduleCorrection();
  let removeViewportListeners = null;

  function bindViewportListeners() {
    if (!isClient() || removeViewportListeners || !isEnabled()) return;
    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    visualViewport.addEventListener("resize", handleViewportChange, {
      passive: true,
    });
    visualViewport.addEventListener("scroll", handleViewportChange, {
      passive: true,
    });
    removeViewportListeners = () => {
      visualViewport.removeEventListener("resize", handleViewportChange);
      visualViewport.removeEventListener("scroll", handleViewportChange);
      removeViewportListeners = null;
    };
  }

  function unbindViewportListeners() {
    removeViewportListeners?.();
  }

  onBeforeUnmount(() => {
    clear();
    unbindViewportListeners();
  });

  return {
    handleFocusIn,
    handleFocusOut,
    handlePointerDown,
    scheduleCorrection,
    runCorrection,
    clear,
    getViewport,
  };
}
