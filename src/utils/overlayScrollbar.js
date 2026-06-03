/**
 * @file utils/overlayScrollbar.js
 * @description OverlayScrollbars 초기화/정리 공통 유틸입니다.
 * body/html, textarea, input 등 키보드/입력과 직접 연결되는 영역은 호출부에서 제외합니다.
 */
import {OverlayScrollbars} from "overlayscrollbars";
import "overlayscrollbars/overlayscrollbars.css";

export const OVERLAY_SCROLLBAR_OPTIONS = Object.freeze({
  overflow: {
    x: "scroll",
    y: "scroll",
  },
  scrollbars: {
    theme: "os-theme-chat-app",
    autoHide: "leave",
    autoHideDelay: 450,
    clickScroll: true,
  },
});

const overlayInstances = new WeakMap();

function canUseDom() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function isActualAndroidRuntime() {
  if (!canUseDom()) return false;
  return Boolean(window.AndroidBridge || /Android/i.test(navigator.userAgent || ""));
}

function isUnsafeTarget(element) {
  if (!element || !canUseDom()) return true;
  if (isActualAndroidRuntime()) return true;
  const tagName = String(element.tagName || "").toLowerCase();
  return (
    element === document.body ||
    element === document.documentElement ||
    ["textarea", "input", "select"].includes(tagName) ||
    Boolean(
      element.closest?.(
        "textarea,input,select,.prompt-box,.prompt-input-row,.bottom-sheet-drag-area,.bottom-sheet-handle,.attachment-preview-row"
      )
    )
  );
}

function mergeOptions(options = {}) {
  return {
    ...OVERLAY_SCROLLBAR_OPTIONS,
    ...options,
    overflow: {
      ...OVERLAY_SCROLLBAR_OPTIONS.overflow,
      ...(options.overflow || {}),
    },
    scrollbars: {
      ...OVERLAY_SCROLLBAR_OPTIONS.scrollbars,
      ...(options.scrollbars || {}),
    },
  };
}

export function initOverlayScrollbar(element, options = {}) {
  if (isUnsafeTarget(element)) return null;

  const cached = overlayInstances.get(element);
  if (cached && !cached.state?.().destroyed) {
    cached.options(mergeOptions(options));
    cached.update();
    return cached;
  }

  const instance = OverlayScrollbars(element, mergeOptions(options));
  overlayInstances.set(element, instance);
  element.dataset.overlayScrollbarEnhanced = "true";
  return instance;
}

export function destroyOverlayScrollbar(element) {
  const instance = element ? overlayInstances.get(element) : null;
  if (!instance) return;
  instance.destroy();
  overlayInstances.delete(element);
  if (element?.dataset) delete element.dataset.overlayScrollbarEnhanced;
}

export function destroyMarkdownScrollbars(rootElement) {
  if (!rootElement || !canUseDom()) return;
  const targets = rootElement.matches?.(MARKDOWN_SCROLL_SELECTOR)
    ? [rootElement]
    : Array.from(rootElement.querySelectorAll(MARKDOWN_SCROLL_SELECTOR));

  targets.forEach((target) => destroyOverlayScrollbar(target));
}

export function getOverlayScrollbarViewport(element) {
  const instance = element ? overlayInstances.get(element) : null;
  return instance?.elements?.().viewport || element || null;
}

export function updateOverlayScrollbar(element) {
  const instance = element ? overlayInstances.get(element) : null;
  instance?.update?.();
}

const MARKDOWN_SCROLL_SELECTOR = [
  ".md-table-wrapper",
  ".md-code-pre",
  ".md-mermaid",
  ".markdown-body pre:not(.md-code-pre)",
  ".markdown-body .katex-display",
].join(",");

export function enhanceMarkdownScrollbars(rootElement) {
  if (!rootElement || !canUseDom()) return;
  const targets = rootElement.matches?.(MARKDOWN_SCROLL_SELECTOR)
    ? [rootElement]
    : Array.from(rootElement.querySelectorAll(MARKDOWN_SCROLL_SELECTOR));

  targets.forEach((target) => {
    initOverlayScrollbar(target, {
      overflow: {x: "scroll", y: "hidden"},
      scrollbars: {autoHide: "leave", autoHideDelay: 350},
    });
  });
}
