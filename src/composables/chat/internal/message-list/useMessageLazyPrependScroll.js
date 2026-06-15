/**
 * History lazy-prepend scroll anchoring controller.
 *
 * This module owns only viewport anchor capture/restore and the temporary
 * manual lock used after Android/manual previous-history loading. It preserves
 * the exact behavior previously implemented inside useMessageListScroll.
 */
export function createMessageLazyPrependScrollController({
  suppressHistoryLazyScrollRestore,
  updateBottomState,
  updateOverlayScrollbarFrame,
}) {
  let manualHistoryAnchorLockCleanup = null;
  let manualHistoryAnchorLockToken = 0;

  function findMessageElementById(container, messageId) {
    if (!container || !messageId) return null;

    const targetId = String(messageId);
    const nodes = container.querySelectorAll?.("[data-message-id]") || [];
    for (const node of nodes) {
      if (node?.getAttribute?.("data-message-id") === targetId) {
        return node;
      }
    }
    return null;
  }

  function getElementOffsetTopWithinScroll(element, container) {
    if (!element || !container) return 0;

    let top = 0;
    let current = element;
    while (current && current !== container) {
      top += Number(current.offsetTop || 0);
      current = current.offsetParent;
    }

    if (current === container) return top;

    const containerRect = container.getBoundingClientRect?.();
    const elementRect = element.getBoundingClientRect?.();
    if (!containerRect || !elementRect) return 0;
    return container.scrollTop + elementRect.top - containerRect.top;
  }

  function getHistoryLazyViewportAnchor(el) {
    if (!el?.querySelectorAll || !el.getBoundingClientRect) return null;

    const containerRect = el.getBoundingClientRect();
    const anchorTopLimit = containerRect.top + 12;
    const anchorBottomLimit = containerRect.bottom - 12;
    const candidates = Array.from(el.querySelectorAll("[data-message-id]"));

    let fallback = null;
    for (const node of candidates) {
      if (!node?.getBoundingClientRect) continue;
      const rect = node.getBoundingClientRect();
      if (rect.bottom <= anchorTopLimit || rect.top >= anchorBottomLimit) {
        continue;
      }

      const id = node.getAttribute("data-message-id");
      if (!id) continue;

      const snapshot = {
        id,
        scrollTop: el.scrollTop,
        offsetTop: getElementOffsetTopWithinScroll(node, el),
        viewportTop: rect.top - containerRect.top,
      };

      // 화면 맨 위에 반쯤 걸친 요소보다 화면 안쪽에 안정적으로 보이는 요소를 우선합니다.
      if (rect.top >= anchorTopLimit) {
        return snapshot;
      }
      if (!fallback) fallback = snapshot;
    }

    return fallback;
  }

  function restoreHistoryLazyViewportAnchor(el, anchor) {
    if (!el || !anchor?.id) return false;

    const target = findMessageElementById(el, anchor.id);
    if (!target) return false;

    const currentOffsetTop = getElementOffsetTopWithinScroll(target, el);
    const delta = currentOffsetTop - Number(anchor.offsetTop || 0);
    const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const nextScrollTop = Math.min(
      maxScrollTop,
      Math.max(0, Number(anchor.scrollTop || 0) + delta)
    );

    if (Math.abs(el.scrollTop - nextScrollTop) >= 1) {
      suppressHistoryLazyScrollRestore();
      el.scrollTop = nextScrollTop;
    }
    return true;
  }

  function restoreHistoryLazyViewportAnchorByViewport(el, anchor) {
    if (!el || !anchor?.id || !el.getBoundingClientRect) return false;

    const target = findMessageElementById(el, anchor.id);
    if (!target?.getBoundingClientRect) return false;

    const containerRect = el.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentViewportTop = targetRect.top - containerRect.top;
    const expectedViewportTop = Number.isFinite(anchor.viewportTop)
      ? Number(anchor.viewportTop)
      : 0;
    const delta = currentViewportTop - expectedViewportTop;

    if (Math.abs(delta) < 0.5) return true;

    const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const nextScrollTop = Math.min(
      maxScrollTop,
      Math.max(0, el.scrollTop + delta)
    );

    if (Math.abs(el.scrollTop - nextScrollTop) >= 0.5) {
      suppressHistoryLazyScrollRestore();
      el.scrollTop = nextScrollTop;
    }
    return true;
  }

  function cancelManualHistoryAnchorLock() {
    manualHistoryAnchorLockToken += 1;
    if (typeof manualHistoryAnchorLockCleanup === "function") {
      manualHistoryAnchorLockCleanup();
    }
    manualHistoryAnchorLockCleanup = null;
  }

  function collectElementsBeforeAnchor(el, anchorId) {
    if (!el?.querySelectorAll || !anchorId) return [];

    const nodes = Array.from(el.querySelectorAll("[data-message-id]"));
    const result = [];
    for (const node of nodes) {
      const id = node?.getAttribute?.("data-message-id");
      if (id === anchorId) break;
      if (node?.nodeType === 1) result.push(node);
    }
    return result;
  }

  function startManualHistoryAnchorLock(el, anchor, duration = 2200) {
    if (!el || !anchor?.id || typeof window === "undefined") return false;

    cancelManualHistoryAnchorLock();
    const token = manualHistoryAnchorLockToken;
    let target = findMessageElementById(el, anchor.id);
    if (!target) return false;

    let finished = false;
    let rafId = 0;
    const timerIds = [];
    let resizeObserver = null;
    let mutationObserver = null;
    let observedNodes = [];

    el.classList?.add?.("message-list--history-prepend-locking");

    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
      resizeObserver?.disconnect?.();
      mutationObserver?.disconnect?.();
      observedNodes = [];
      el.classList?.remove?.("message-list--history-prepend-locking");
      if (manualHistoryAnchorLockCleanup === cleanup) {
        manualHistoryAnchorLockCleanup = null;
      }
    };

    const scheduleAdjust = () => {
      if (finished || rafId || token !== manualHistoryAnchorLockToken) return;
      rafId = window.requestAnimationFrame(adjust);
    };

    const observePrependNodes = () => {
      if (typeof ResizeObserver === "undefined") return;
      target = findMessageElementById(el, anchor.id);
      if (!target) return;

      const nextNodes = collectElementsBeforeAnchor(el, anchor.id);
      if (
        nextNodes.length === observedNodes.length &&
        nextNodes.every((node, index) => node === observedNodes[index])
      ) {
        return;
      }

      observedNodes = nextNodes;
      resizeObserver?.disconnect?.();
      resizeObserver = new ResizeObserver(scheduleAdjust);
      observedNodes.forEach((node) => resizeObserver.observe(node));
      resizeObserver.observe(target);
    };

    function adjust() {
      rafId = 0;
      if (finished || token !== manualHistoryAnchorLockToken) {
        cleanup();
        return;
      }
      target = findMessageElementById(el, anchor.id);
      if (!target) {
        cleanup();
        return;
      }
      restoreHistoryLazyViewportAnchorByViewport(el, anchor);
      observePrependNodes();
      updateOverlayScrollbarFrame();
      updateBottomState();
    }

    manualHistoryAnchorLockCleanup = cleanup;
    observePrependNodes();

    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(scheduleAdjust);
      mutationObserver.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    scheduleAdjust();
    [
      0, 16, 32, 64, 96, 160, 240, 360, 520, 760, 1040, 1400, 1800, 2200,
    ].forEach((delay) => {
      timerIds.push(window.setTimeout(scheduleAdjust, delay));
    });

    timerIds.push(window.setTimeout(cleanup, duration));
    return true;
  }

  return {
    cancelManualHistoryAnchorLock,
    getHistoryLazyViewportAnchor,
    restoreHistoryLazyViewportAnchor,
    restoreHistoryLazyViewportAnchorByViewport,
    startManualHistoryAnchorLock,
  };
}
