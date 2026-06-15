import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/utils/overlayScrollbar";

export function createMessageOverlayScrollSyncController({
  scrollRef,
  emit,
  onScroll,
  recalculateFocusSpacerHeight,
  updateBottomState,
  shouldUseOverlayScrollbar = () => true,
}) {
  let overlayScrollViewport = null;
  let overlayScrollSource = null;
  let trackedRafIds = [];
  let renderedFrameRafId = 0;
  let renderedFrameNeedsSpacer = false;
  let renderedFrameNeedsBottomState = false;

  function getScrollElement() {
    return overlayScrollViewport || scrollRef.value;
  }

  function cleanupOverlayScrollbar() {
    if (
      overlayScrollViewport &&
      overlayScrollViewport !== overlayScrollSource
    ) {
      overlayScrollViewport.removeEventListener("scroll", onScroll);
    }
    if (overlayScrollSource) destroyOverlayScrollbar(overlayScrollSource);
    overlayScrollViewport = null;
    overlayScrollSource = null;
  }

  function resolveShouldUseOverlayScrollbar() {
    return typeof shouldUseOverlayScrollbar === "function"
      ? Boolean(shouldUseOverlayScrollbar())
      : Boolean(shouldUseOverlayScrollbar);
  }

  function setupOverlayScrollbar() {
    if (!resolveShouldUseOverlayScrollbar()) {
      cleanupOverlayScrollbar();
      return;
    }

    const element = scrollRef.value;
    if (!element || overlayScrollSource === element) return;

    cleanupOverlayScrollbar();
    overlayScrollSource = element;
    const instance = initOverlayScrollbar(
      element,
      {
        overflow: {x: "hidden", y: "scroll"},
      },
      {enabled: resolveShouldUseOverlayScrollbar}
    );
    if (!instance) {
      overlayScrollSource = null;
      overlayScrollViewport = null;
      return;
    }

    overlayScrollViewport = getOverlayScrollbarViewport(element);
    if (overlayScrollViewport && overlayScrollViewport !== element) {
      overlayScrollViewport.addEventListener("scroll", onScroll, {
        passive: true,
      });
    }
  }

  function updateOverlayScrollbarFrame() {
    if (!overlayScrollSource) return;
    updateOverlayScrollbar(overlayScrollSource);
  }

  function scheduleTrackedAnimationFrame(callback) {
    if (typeof window === "undefined") {
      callback?.();
      return 0;
    }

    const rafId = window.requestAnimationFrame(() => {
      trackedRafIds = trackedRafIds.filter((id) => id !== rafId);
      callback?.();
    });
    trackedRafIds.push(rafId);
    return rafId;
  }

  function clearTrackedAnimationFrames() {
    if (typeof window === "undefined") {
      trackedRafIds = [];
      return;
    }
    trackedRafIds.forEach((rafId) => window.cancelAnimationFrame(rafId));
    trackedRafIds = [];
  }

  function clearRenderedFrameScheduler() {
    if (!renderedFrameRafId || typeof window === "undefined") return;
    window.cancelAnimationFrame(renderedFrameRafId);
    renderedFrameRafId = 0;
    renderedFrameNeedsSpacer = false;
    renderedFrameNeedsBottomState = false;
  }

  function scheduleRenderedFrameUpdate(options = {}) {
    emit("content-rendered");

    const needsSpacer = options.spacer !== false;
    renderedFrameNeedsSpacer = renderedFrameNeedsSpacer || needsSpacer;
    renderedFrameNeedsBottomState =
      renderedFrameNeedsBottomState || options.bottomState === true;

    if (typeof window === "undefined") {
      updateOverlayScrollbarFrame();
      if (renderedFrameNeedsSpacer) recalculateFocusSpacerHeight();
      if (renderedFrameNeedsBottomState) updateBottomState();
      renderedFrameNeedsSpacer = false;
      renderedFrameNeedsBottomState = false;
      return;
    }

    if (renderedFrameRafId) return;

    renderedFrameRafId = window.requestAnimationFrame(() => {
      renderedFrameRafId = 0;
      updateOverlayScrollbarFrame();
      if (renderedFrameNeedsSpacer) recalculateFocusSpacerHeight();
      if (renderedFrameNeedsBottomState) updateBottomState();
      renderedFrameNeedsSpacer = false;
      renderedFrameNeedsBottomState = false;
    });
  }

  return {
    clearRenderedFrameScheduler,
    clearTrackedAnimationFrames,
    cleanupOverlayScrollbar,
    getScrollElement,
    scheduleRenderedFrameUpdate,
    scheduleTrackedAnimationFrame,
    setupOverlayScrollbar,
    updateOverlayScrollbarFrame,
  };
}
