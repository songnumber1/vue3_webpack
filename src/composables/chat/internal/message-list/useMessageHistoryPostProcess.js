import {nextTick} from "vue";
import {
  fallbackPendingMermaidToCode,
  renderMermaidInElement,
} from "@/utils/mermaidRenderer";
import {
  HISTORY_RENDER_ANDROID_LAYOUT_MAX_FRAMES,
  HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES,
  HISTORY_RENDER_LAYOUT_MAX_FRAMES,
  HISTORY_RENDER_LAYOUT_STABLE_FRAMES,
  HISTORY_RENDER_MERMAID_BATCH_SIZE,
} from "./messageListScrollConstants";
import {waitAnimationFrames} from "./messageListFrameScheduler";

export function createMessageHistoryPostProcessController({
  props,
  scrollRef,
  bottomRef,
  getScrollElement,
  getPendingHistoryRenderMermaidTargets,
  getHistoryRenderRunId,
  isAndroidHistoryRenderRuntime,
  isMermaidRenderingEnabled,
  updateOverlayScrollbarFrame,
  applyHistoryRenderBottomScroll,
}) {
  function isCurrentHistoryRenderRun(runId) {
    return runId === getHistoryRenderRunId() && props.historyRendering;
  }

  async function updateHistoryRenderFrameAfterBatch(processedCount = 0) {
    if (processedCount % HISTORY_RENDER_MERMAID_BATCH_SIZE !== 0) return;
    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
    await nextTick();
    await waitAnimationFrames(1);
  }

  async function renderHistoryRoomPendingMermaidSequentially(runId) {
    await nextTick();
    if (!isCurrentHistoryRenderRun(runId)) return false;

    await waitAnimationFrames(1);
    if (!isCurrentHistoryRenderRun(runId)) return false;

    const root = scrollRef.value;
    if (!root?.isConnected) return true;

    if (!isMermaidRenderingEnabled()) {
      fallbackPendingMermaidToCode(root);
      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();
      return true;
    }

    const targets = getPendingHistoryRenderMermaidTargets(root);
    if (!targets.length) {
      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();
      return true;
    }

    try {
      await renderMermaidInElement(root, {
        renderRetryCount: isAndroidHistoryRenderRuntime() ? 3 : 1,
        renderRetryFrameGap: isAndroidHistoryRenderRuntime() ? 2 : 1,
        onTargetComplete: async (_target, processedCount) => {
          if (!isCurrentHistoryRenderRun(runId)) return;
          await updateHistoryRenderFrameAfterBatch(processedCount);
        },
      });
    } catch {
      // Mermaid 렌더링/문법 오류가 발생해도 history render는 계속 진행합니다.
    } finally {
      fallbackPendingMermaidToCode(root);
    }

    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
    return true;
  }

  function getHistoryRenderLayoutMetrics() {
    const el = getScrollElement();
    const bottom = bottomRef.value;
    if (!el) {
      return "no-scroll-element";
    }

    const bottomRect = bottom?.getBoundingClientRect?.();
    return [
      Math.round(el.scrollHeight),
      Math.round(el.clientHeight),
      Math.round(el.scrollTop),
      bottomRect ? Math.round(bottomRect.top) : "no-bottom",
      bottomRect ? Math.round(bottomRect.height) : "no-bottom-height",
    ].join(":");
  }

  function hasPendingHistoryRenderMermaid() {
    const root = scrollRef.value;
    if (!root?.isConnected) return false;
    return getPendingHistoryRenderMermaidTargets(root).length > 0;
  }

  async function waitForHistoryRenderLayoutStability(runId) {
    const isAndroid = isAndroidHistoryRenderRuntime();
    const requiredStableFrames = isAndroid
      ? HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES
      : HISTORY_RENDER_LAYOUT_STABLE_FRAMES;
    const maxFrames = isAndroid
      ? HISTORY_RENDER_ANDROID_LAYOUT_MAX_FRAMES
      : HISTORY_RENDER_LAYOUT_MAX_FRAMES;
    let previousMetrics = "";
    let stableFrames = 0;

    for (let frame = 0; frame < maxFrames; frame += 1) {
      if (!isCurrentHistoryRenderRun(runId)) return false;

      await waitAnimationFrames(1);
      if (!isCurrentHistoryRenderRun(runId)) return false;

      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();
      await nextTick();
      if (!isCurrentHistoryRenderRun(runId)) return false;

      const metrics = getHistoryRenderLayoutMetrics();
      if (metrics === previousMetrics && !hasPendingHistoryRenderMermaid()) {
        stableFrames += 1;
      } else {
        stableFrames = 0;
        previousMetrics = metrics;
      }

      if (stableFrames >= requiredStableFrames) {
        return true;
      }
    }

    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
    return true;
  }

  function finalizeHistoryRenderPostProcess() {
    const root = scrollRef.value;
    fallbackPendingMermaidToCode(root);
    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
  }

  return {
    finalizeHistoryRenderPostProcess,
    renderHistoryRoomPendingMermaidSequentially,
    waitForHistoryRenderLayoutStability,
  };
}
