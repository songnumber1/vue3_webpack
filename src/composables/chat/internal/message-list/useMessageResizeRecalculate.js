export function createMessageResizeRecalculateController({
  debounceMs,
  getIsHistoryRendering,
  recalculateFocusSpacerHeight,
  refreshManualHistoryLoadMode,
  updateBottomState,
  updateOverlayScrollbarFrame,
}) {
  let resizeRecalculateTimerId = 0;
  let resizeRecalculateRafId = 0;

  function runResizeRecalculateFrame() {
    refreshManualHistoryLoadMode();
    recalculateFocusSpacerHeight();
    updateOverlayScrollbarFrame();
    updateBottomState();
  }

  function clearResizeRecalculateScheduler() {
    if (resizeRecalculateTimerId) {
      window.clearTimeout(resizeRecalculateTimerId);
      resizeRecalculateTimerId = 0;
    }
    if (resizeRecalculateRafId) {
      window.cancelAnimationFrame(resizeRecalculateRafId);
      resizeRecalculateRafId = 0;
    }
  }

  function scheduleResizeRecalculate() {
    if (typeof window === "undefined") {
      recalculateFocusSpacerHeight();
      return;
    }

    // 대화방 입장 history render 중에는 고정 시간 debounce를 사용하지 않습니다.
    // 화면은 hidden 상태에서 렌더/mermaid/scroll 안정화 루프가 순차 진행하므로,
    // resize observer가 끼어들어도 다음 paint에서 한 번만 보정합니다.
    clearResizeRecalculateScheduler();
    if (getIsHistoryRendering()) {
      resizeRecalculateRafId = window.requestAnimationFrame(() => {
        resizeRecalculateRafId = 0;
        runResizeRecalculateFrame();
      });
      return;
    }

    // 긴 대화방(250~1000개)에서 resize 이벤트가 연속 발생할 때마다
    // scrollHeight/getBoundingClientRect/querySelectorAll 계열 계산을 수행하면
    // 화면 전환 반응이 크게 느려집니다. 마지막 resize 프레임 근처에서 한 번만
    // composer spacer와 OverlayScrollbars를 갱신합니다.
    resizeRecalculateTimerId = window.setTimeout(() => {
      resizeRecalculateTimerId = 0;
      resizeRecalculateRafId = window.requestAnimationFrame(() => {
        resizeRecalculateRafId = 0;
        runResizeRecalculateFrame();
      });
    }, debounceMs);
  }

  return {
    clearResizeRecalculateScheduler,
    scheduleResizeRecalculate,
  };
}
