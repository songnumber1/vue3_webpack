import {nextTick, onBeforeUnmount, onMounted, watch} from "vue";

export function useConversationComposerHeight({
  composerSlotRef,
  isHistoryRendering,
  watchSources = [],
  onBeforeUpdate,
} = {}) {
  let composerResizeObserver = null;
  let composerHeightTimerIds = [];
  let composerHeightRafId = 0;

  function updateComposerHeight() {
    if (typeof document === "undefined") return;
    const height = composerSlotRef?.value?.offsetHeight || 0;
    document.documentElement.style.setProperty(
      "--chat-composer-height",
      `${Math.max(height, 72)}px`
    );
  }

  function clearComposerHeightSchedule() {
    if (typeof window !== "undefined") {
      composerHeightTimerIds.forEach((timerId) => window.clearTimeout(timerId));
      if (composerHeightRafId) {
        window.cancelAnimationFrame(composerHeightRafId);
      }
    }
    composerHeightTimerIds = [];
    composerHeightRafId = 0;
  }

  function scheduleComposerHeightUpdate() {
    if (typeof window === "undefined") {
      updateComposerHeight();
      return;
    }

    clearComposerHeightSchedule();
    composerHeightRafId = window.requestAnimationFrame(() => {
      composerHeightRafId = 0;
      updateComposerHeight();
    });

    if (isHistoryRendering?.value) {
      return;
    }

    composerHeightTimerIds = [80, 160].map((delay) =>
      window.setTimeout(updateComposerHeight, delay)
    );
  }

  function observeComposerHeight() {
    if (!composerSlotRef?.value) return;
    updateComposerHeight();
    if (typeof ResizeObserver !== "undefined") {
      composerResizeObserver = new ResizeObserver(scheduleComposerHeightUpdate);
      composerResizeObserver.observe(composerSlotRef.value);
    }
  }

  function cleanupComposerHeightObserver() {
    clearComposerHeightSchedule();
    composerResizeObserver?.disconnect?.();
    composerResizeObserver = null;
  }

  onMounted(async () => {
    await nextTick();
    observeComposerHeight();
  });

  onBeforeUnmount(() => {
    cleanupComposerHeightObserver();
  });

  watch(
    () => watchSources.map((source) => source?.value),
    async () => {
      await nextTick();
      if (typeof onBeforeUpdate === "function") onBeforeUpdate();
      scheduleComposerHeightUpdate();
    }
  );

  return {
    updateComposerHeight,
    scheduleComposerHeightUpdate,
    cleanupComposerHeightObserver,
  };
}
