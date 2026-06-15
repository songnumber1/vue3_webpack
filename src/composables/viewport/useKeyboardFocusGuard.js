/**
 * @file composables/viewport/useKeyboardFocusGuard.js
 * @description
 * Android Chrome/WebView keyboard focus helper for scroll-based form screens.
 *
 * Scope:
 * - Provides a reusable focus/VisualViewport correction layer for scroll-based
 *   form screens such as StudioCreatePage.
 * - It only guards keyboard-capable fields by default. Checkbox/radio/file and
 *   button-like input types are ignored so selection controls do not trigger
 *   unnecessary Android keyboard scroll corrections. Screens can also opt out
 *   of plain input correction with ignoreInput when native Android handling is
 *   smoother.
 * - BottomSheet, top search bars, main composer and chat composer remain owned
 *   by their existing implementations until explicitly migrated.
 */

import {nextTick, onBeforeUnmount, unref} from "vue";

const DEFAULT_DELAYS = [80, 180, 340, 560];
const DEFAULT_EDGE_PADDING = {
  top: 14,
  bottom: 24,
};
const DEFAULT_FIELD_SELECTOR = "label, fieldset";
const DEFAULT_SCROLL_BEHAVIOR = null;
const EDITABLE_SELECTOR = "input, textarea, select, [contenteditable='true']";
const KEYBOARD_INPUT_TYPES = new Set([
  "text",
  "search",
  "email",
  "tel",
  "url",
  "password",
  "number",
]);
const NON_KEYBOARD_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "date",
  "datetime-local",
  "file",
  "hidden",
  "image",
  "month",
  "radio",
  "range",
  "reset",
  "submit",
  "time",
  "week",
]);

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

function resolveScrollContainer(source) {
  const value = resolveMaybeRef(source);

  if (!value) return null;
  if (typeof value.getViewport === "function") {
    return value.getViewport();
  }
  if (isHTMLElement(value)) return value;
  if (isHTMLElement(value.$el)) return value.$el;

  return null;
}

function readNumber(value, fallback) {
  const resolved = resolveMaybeRef(value);
  return Number.isFinite(Number(resolved)) ? Number(resolved) : fallback;
}

function isKeyboardEditableField(element, options) {
  if (!isHTMLElement(element)) return false;
  if (!element.matches?.(EDITABLE_SELECTOR)) return false;
  if (options.excludeSelector && element.matches?.(options.excludeSelector)) {
    return false;
  }

  if (element.tagName === "TEXTAREA") {
    return !options.ignoreTextarea;
  }

  if (element.tagName === "SELECT") {
    return options.includeSelect !== false;
  }

  if (element.tagName === "INPUT") {
    if (options.ignoreInput) return false;
    const type = (element.getAttribute("type") || "text").toLowerCase();
    if (NON_KEYBOARD_INPUT_TYPES.has(type)) return false;
    if (KEYBOARD_INPUT_TYPES.has(type)) return true;
    return options.includeUnknownInputTypes === true;
  }

  return element.isContentEditable === true;
}

function getVisibleViewportBounds(scroller, options) {
  const visualViewport = window.visualViewport;
  const scrollerRect = scroller.getBoundingClientRect();
  const offsetTop = Math.round(visualViewport?.offsetTop || 0);
  const visualHeight = Math.round(
    visualViewport?.height || window.innerHeight || scrollerRect.bottom
  );
  const viewportTop = Math.max(scrollerRect.top, offsetTop);
  const viewportBottom = Math.min(
    scrollerRect.bottom,
    offsetTop + visualHeight
  );

  return {
    top:
      viewportTop +
      readNumber(options.edgePaddingTop, DEFAULT_EDGE_PADDING.top),
    bottom:
      viewportBottom -
      readNumber(options.edgePaddingBottom, DEFAULT_EDGE_PADDING.bottom),
  };
}

/**
 * Creates a reusable keyboard focus guard for scrollable form pages.
 *
 * @param {Object} options
 * @param {boolean|import('vue').Ref<boolean>|Function} [options.enabled=true]
 *   Whether the guard should run. Pass an isMobile computed/ref for mobile-only screens.
 * @param {HTMLElement|import('vue').Ref<HTMLElement>|Function|Object} options.scrollContainer
 *   Scroll container element, ref, function, or an OverlayScrollbars adapter with getViewport().
 * @param {boolean} [options.ignoreInput=false]
 *   Keep true for screens where Android native input keyboard scrolling is more stable.
 * @param {boolean} [options.ignoreTextarea=false]
 *   Keep true for screens where Android native textarea keyboard scrolling is more stable.
 * @param {boolean} [options.includeSelect=true]
 *   Whether select focus should use the same visibility guard.
 * @param {boolean} [options.includeUnknownInputTypes=false]
 *   Opt into guarding non-standard input types. Checkbox/radio/file/button-like
 *   inputs remain excluded by default because they do not open the keyboard.
 * @param {string} [options.fieldSelector="label, fieldset"]
 *   Closest wrapper to measure instead of the raw input.
 * @param {number[]} [options.delays=[80,180,340,560]]
 *   Repeated correction delays for Android visualViewport settle timing.
 * @returns {{handleKeyboardFocusIn: Function, handleKeyboardFocusOut: Function, ensureFocusedElementVisible: Function, scheduleFocusedElementVisible: Function, clearKeyboardFocusTimers: Function}}
 */
export function useKeyboardFocusGuard(options = {}) {
  const guardOptions = {
    enabled: true,
    scrollContainer: null,
    ignoreInput: false,
    ignoreTextarea: false,
    includeSelect: true,
    includeUnknownInputTypes: false,
    fieldSelector: DEFAULT_FIELD_SELECTOR,
    delays: DEFAULT_DELAYS,
    edgePaddingTop: DEFAULT_EDGE_PADDING.top,
    edgePaddingBottom: DEFAULT_EDGE_PADDING.bottom,
    scrollBehavior: DEFAULT_SCROLL_BEHAVIOR,
    ...options,
  };
  let focusedElement = null;
  let repeatedFocusTimers = [];

  function isEnabled() {
    return resolveMaybeRef(guardOptions.enabled) !== false;
  }

  function clearKeyboardFocusTimers() {
    if (!isClient()) return;
    repeatedFocusTimers.forEach((timer) => window.clearTimeout(timer));
    repeatedFocusTimers = [];
  }

  function ensureFocusedElementVisible(behavior = "smooth") {
    if (!isClient() || !isEnabled()) return;

    const target = focusedElement;
    const scroller = resolveScrollContainer(guardOptions.scrollContainer);
    if (!target || !scroller) return;

    const field =
      target.closest?.(guardOptions.fieldSelector || DEFAULT_FIELD_SELECTOR) ||
      target;
    if (!isHTMLElement(field)) return;

    const bounds = getVisibleViewportBounds(scroller, guardOptions);
    const fieldRect = field.getBoundingClientRect();
    let delta = 0;
    if (fieldRect.bottom > bounds.bottom) {
      delta = fieldRect.bottom - bounds.bottom;
    } else if (fieldRect.top < bounds.top) {
      delta = fieldRect.top - bounds.top;
    }

    // Do not pre-align visible fields to an arbitrary target position. Android
    // Chrome/WebView already performs its own visualViewport adjustment while
    // the keyboard is opening. If this guard scrolls a still-visible input
    // upward first, the native adjustment can pull it back down a moment later,
    // which looks like a brief up/down jump. Only scroll when the focused field
    // is actually outside the visible viewport bounds.
    if (Math.abs(delta) > 3) {
      scroller.scrollBy?.({top: delta, left: 0, behavior});
    }
  }

  function scheduleFocusedElementVisible() {
    if (!isClient() || !isEnabled() || !focusedElement) return;
    clearKeyboardFocusTimers();

    const delays = Array.isArray(guardOptions.delays)
      ? guardOptions.delays
      : DEFAULT_DELAYS;
    repeatedFocusTimers = delays.map((delay, index) =>
      window.setTimeout(() => {
        const configuredBehavior = resolveMaybeRef(guardOptions.scrollBehavior);
        ensureFocusedElementVisible(
          configuredBehavior || (index === 0 ? "auto" : "smooth")
        );
      }, delay)
    );
  }

  function handleKeyboardFocusIn(event) {
    const target = event?.target;
    if (!isEnabled()) return;

    // Preserve screen-level native handling for ignored editable fields
    // such as Android textarea focus. When a field is intentionally ignored,
    // clear any pending correction from the previously focused element so the
    // old scroll target cannot run after focus has moved.
    if (!isKeyboardEditableField(target, guardOptions)) {
      if (isHTMLElement(target) && target.matches?.(EDITABLE_SELECTOR)) {
        focusedElement = null;
        clearKeyboardFocusTimers();
      }
      return;
    }

    focusedElement = target;
    nextTick(scheduleFocusedElementVisible);
  }

  function handleKeyboardFocusOut(event) {
    if (event?.target === focusedElement) {
      focusedElement = null;
      clearKeyboardFocusTimers();
    }
  }

  if (isClient()) {
    window.visualViewport?.addEventListener(
      "resize",
      scheduleFocusedElementVisible,
      {passive: true}
    );
    window.visualViewport?.addEventListener(
      "scroll",
      scheduleFocusedElementVisible,
      {passive: true}
    );
  }

  onBeforeUnmount(() => {
    clearKeyboardFocusTimers();
    if (!isClient()) return;
    window.visualViewport?.removeEventListener(
      "resize",
      scheduleFocusedElementVisible
    );
    window.visualViewport?.removeEventListener(
      "scroll",
      scheduleFocusedElementVisible
    );
  });

  return {
    handleKeyboardFocusIn,
    handleKeyboardFocusOut,
    ensureFocusedElementVisible,
    scheduleFocusedElementVisible,
    clearKeyboardFocusTimers,
  };
}
