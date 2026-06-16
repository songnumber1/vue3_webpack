import {nextTick} from "vue";
import {waitAnimationFrames} from "./messageListFrameScheduler";
import {DEFAULT_HISTORY_LAZY_TOP_THRESHOLD} from "./messageListScrollConstants";

function blurHistoryLoadMoreTrigger(event) {
  const target = event?.currentTarget || event?.target || null;
  if (typeof target?.blur === "function") {
    target.blur();
  }

  const active =
    typeof document !== "undefined" ? document.activeElement : null;
  if (active && active !== document.body && typeof active.blur === "function") {
    active.blur();
  }
}

export function createPreviousHistoryLazyLoadController({
  props,
  emit,
  previousHistoryLoadInProgress,
  getScrollElement,
  getHistoryLazyViewportAnchor,
  restoreHistoryLazyViewportAnchor,
  restoreHistoryLazyViewportAnchorByViewport,
  startManualHistoryAnchorLock,
  suppressHistoryLazyScrollRestore,
  updateBottomState,
  updateOverlayScrollbarFrame,
}) {
  async function requestPreviousHistoryMessagesIfNeeded(options = {}) {
    if (props.historyRendering || props.loading) return false;
    if (
      !props.hasPreviousHistoryMessages ||
      previousHistoryLoadInProgress.value
    ) {
      return false;
    }

    const el = getScrollElement();
    const threshold = Number(props.historyLazyTopThreshold);
    const topThreshold =
      Number.isFinite(threshold) && threshold >= 0
        ? threshold
        : DEFAULT_HISTORY_LAZY_TOP_THRESHOLD;
    if (!el || (!options.force && el.scrollTop > topThreshold)) return false;

    previousHistoryLoadInProgress.value = true;
    const previousScrollHeight = el.scrollHeight;
    const previousScrollTop = el.scrollTop;
    const anchor = getHistoryLazyViewportAnchor(el);
    const useManualViewportLock = options.manual === true;

    try {
      suppressHistoryLazyScrollRestore(useManualViewportLock ? 900 : 420);
      emit("load-previous-history");
      await nextTick();

      if (useManualViewportLock) {
        const restoredByViewport = restoreHistoryLazyViewportAnchorByViewport(
          el,
          anchor
        );
        if (!restoredByViewport) {
          const heightDelta = Math.max(
            0,
            el.scrollHeight - previousScrollHeight
          );
          suppressHistoryLazyScrollRestore();
          el.scrollTop = Math.max(0, previousScrollTop + heightDelta);
        }
        startManualHistoryAnchorLock(el, anchor);
        updateOverlayScrollbarFrame();
        updateBottomState();
        return true;
      }

      await waitAnimationFrames(2);
      updateOverlayScrollbarFrame();

      const nextScrollHeight = el.scrollHeight;
      const heightDelta = Math.max(0, nextScrollHeight - previousScrollHeight);
      if (heightDelta <= 0) {
        updateBottomState();
        return true;
      }

      const restoredByAnchor = restoreHistoryLazyViewportAnchor(el, anchor);
      if (!restoredByAnchor) {
        suppressHistoryLazyScrollRestore();
        el.scrollTop = Math.max(0, previousScrollTop + heightDelta);
      }

      updateOverlayScrollbarFrame();
      updateBottomState();
      return true;
    } finally {
      previousHistoryLoadInProgress.value = false;
    }
  }

  function handleManualPreviousHistoryLoad(event) {
    blurHistoryLoadMoreTrigger(event);
    return requestPreviousHistoryMessagesIfNeeded({force: true, manual: true});
  }

  return {
    requestPreviousHistoryMessagesIfNeeded,
    handleManualPreviousHistoryLoad,
  };
}
