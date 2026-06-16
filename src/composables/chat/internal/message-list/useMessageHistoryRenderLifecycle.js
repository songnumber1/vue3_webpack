import {nextTick} from "vue";
import {
  HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES,
  HISTORY_RENDER_DOM_READY_MAX_FRAMES,
  HISTORY_RENDER_READY_STABLE_FRAMES,
} from "./messageListScrollConstants";
import {waitAnimationFrames} from "./messageListFrameScheduler";

export function createMessageHistoryRenderLifecycleController({
  props,
  emit,
  getHistoryRenderRunId,
  setHistoryRenderCompleting,
  isAndroidHistoryRenderRuntime,
  isProgressiveHistoryRender,
  createHistoryRenderDomIndex,
  isProgressiveHistoryRenderInitialReady,
  isHistoryRenderPostProcessReady,
  setupOverlayScrollbar,
  updateOverlayScrollbarFrame,
  renderHistoryRoomPendingMermaidSequentially,
  recalculateFocusSpacerHeight,
  applyHistoryRenderBottomScroll,
  applyHistoryRenderInitialScrollTarget,
  waitForHistoryRenderLayoutStability,
  updateBottomState,
  finalizeHistoryRenderPostProcess,
}) {
  let progressiveHistoryMarkdownRevealed = false;

  function isCurrentHistoryRenderRun(runId) {
    return runId === getHistoryRenderRunId() && props.historyRendering;
  }

  function resetHistoryRenderLifecycleState() {
    progressiveHistoryMarkdownRevealed = false;
  }

  function hasProgressiveHistoryMarkdownRevealed() {
    return progressiveHistoryMarkdownRevealed;
  }

  async function waitForHistoryRenderDomReady(runId) {
    const maxFrames = isAndroidHistoryRenderRuntime()
      ? HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES
      : HISTORY_RENDER_DOM_READY_MAX_FRAMES;
    const isProgressiveRender = isProgressiveHistoryRender();
    const requiredStableFrames = isProgressiveRender
      ? 1
      : HISTORY_RENDER_READY_STABLE_FRAMES;
    let stableFrames = 0;

    for (let frame = 0; frame < maxFrames; frame += 1) {
      if (!isCurrentHistoryRenderRun(runId)) return false;

      await nextTick();
      if (!isProgressiveRender) {
        updateOverlayScrollbarFrame();
      }

      const domIndex = createHistoryRenderDomIndex();
      const ready = isProgressiveRender
        ? isProgressiveHistoryRenderInitialReady(domIndex)
        : isHistoryRenderPostProcessReady(domIndex);
      if (ready) {
        stableFrames += 1;
        if (stableFrames >= requiredStableFrames) return true;
      } else {
        stableFrames = 0;
      }

      await waitAnimationFrames(1);
    }

    // 비정상 메시지/마크다운 이벤트 누락이 있어도 progress가 고착되지 않도록
    // 현재 DOM 기준으로 가능한 후처리만 수행하고 finally에서 화면을 해제합니다.
    const fallbackIndex = createHistoryRenderDomIndex();
    return isProgressiveRender
      ? isProgressiveHistoryRenderInitialReady(fallbackIndex)
      : isHistoryRenderPostProcessReady(fallbackIndex);
  }

  async function revealProgressiveHistoryMarkdownIfReady() {
    if (!isProgressiveHistoryRender() || progressiveHistoryMarkdownRevealed) {
      return false;
    }

    const domIndex = createHistoryRenderDomIndex();
    if (!isProgressiveHistoryRenderInitialReady(domIndex)) {
      return false;
    }

    progressiveHistoryMarkdownRevealed = true;
    emit("history-markdown-rendered");

    // MessageList/Input이 실제로 표시된 뒤 viewport 높이가 확정되어야
    // 일반 채팅방 bottom, 공유방 first, 검색 msgId 초기 스크롤이 정확해집니다.
    await nextTick();
    updateOverlayScrollbarFrame();
    applyHistoryRenderInitialScrollTarget({initialReveal: true});
    return true;
  }

  async function runHistoryRenderThenScrollSequence(runId) {
    try {
      if (!isCurrentHistoryRenderRun(runId)) return;

      await nextTick();
      if (!isCurrentHistoryRenderRun(runId)) return;

      setupOverlayScrollbar();
      updateOverlayScrollbarFrame();

      await waitForHistoryRenderDomReady(runId);
      if (!isCurrentHistoryRenderRun(runId)) return;

      const didRevealProgressiveMarkdown =
        await revealProgressiveHistoryMarkdownIfReady();
      if (
        didRevealProgressiveMarkdown &&
        isCurrentHistoryRenderRun(runId) &&
        typeof props.continueProgressiveInitialHistoryRender === "function"
      ) {
        await props.continueProgressiveInitialHistoryRender();
        if (!isCurrentHistoryRenderRun(runId)) return;
        await nextTick();
        updateOverlayScrollbarFrame();
        applyHistoryRenderInitialScrollTarget({initialReveal: true});
      }

      await renderHistoryRoomPendingMermaidSequentially(runId);
      if (!isCurrentHistoryRenderRun(runId)) return;

      recalculateFocusSpacerHeight();
      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();

      if (!isProgressiveHistoryRender()) {
        await waitForHistoryRenderLayoutStability(runId);
        if (!isCurrentHistoryRenderRun(runId)) return;

        updateOverlayScrollbarFrame();
        applyHistoryRenderBottomScroll();
        await nextTick();
        await waitAnimationFrames(2);
        applyHistoryRenderBottomScroll();
      }
      updateBottomState();
    } finally {
      setHistoryRenderCompleting(false);
      if (isCurrentHistoryRenderRun(runId)) {
        finalizeHistoryRenderPostProcess();
        emit("history-rendered");
      }
    }
  }

  return {
    hasProgressiveHistoryMarkdownRevealed,
    resetHistoryRenderLifecycleState,
    runHistoryRenderThenScrollSequence,
    waitForHistoryRenderDomReady,
    revealProgressiveHistoryMarkdownIfReady,
  };
}
