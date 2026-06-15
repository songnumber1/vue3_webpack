export function createMessageBottomScrollController({
  props,
  userIsAtBottom,
  messageScrollTarget,
  updateBottomState,
  shouldApplyHistoryRenderScroll,
  getAssistantMessageIds,
  scheduleTrackedAnimationFrame,
  clearStableTimers,
  stableScrollDelays = [],
  trackStableTimer,
} = {}) {
  let afterRenderScrollRafId = 0;
  let pendingAfterRenderAssistantIds = null;
  let pendingAfterRenderOptions = null;

  function clearAfterRenderScrollScheduler() {
    if (!afterRenderScrollRafId || typeof window === "undefined") return;
    window.cancelAnimationFrame(afterRenderScrollRafId);
    afterRenderScrollRafId = 0;
  }

  function clearAfterRenderScrollState() {
    clearAfterRenderScrollScheduler();
    pendingAfterRenderAssistantIds = null;
    pendingAfterRenderOptions = null;
  }

  function applyBottomScroll(behavior = "auto") {
    if (messageScrollTarget?.scrollToBottom?.({behavior})) {
      userIsAtBottom.value = true;
    }
  }

  function shouldAutoHistoryRenderBottomScroll() {
    // 대화방 이력 진입 시에는 답변 자동 스크롤 설정과 무관하게 항상 마지막 메시지로 이동합니다.
    // autoScrollOnAnswer는 실시간 답변 추적 옵션이고, history render의 시작 위치 정책과 분리되어야 합니다.
    return props.historyRendering === true;
  }

  function applyHistoryRenderInitialScrollTarget(options = {}) {
    if (!shouldAutoHistoryRenderBottomScroll()) return;
    if (!shouldApplyHistoryRenderScroll?.(options)) return;

    const target = props.messageRenderPolicy?.scrollTarget || {type: "bottom"};
    const applied = messageScrollTarget?.applyScrollTarget?.(target, {
      behavior: "auto",
      block: "center",
    });

    if (target?.type === "bottom") {
      userIsAtBottom.value = true;
    } else {
      updateBottomState?.();
    }

    return applied;
  }

  function applyHistoryRenderBottomScroll() {
    return applyHistoryRenderInitialScrollTarget();
  }

  function applyBottomScrollAfterRender() {
    const options = pendingAfterRenderOptions || {};
    clearAfterRenderScrollState();

    scheduleTrackedAnimationFrame?.(() => {
      scheduleTrackedAnimationFrame?.(() => {
        applyBottomScroll(options.behavior || "auto");
      });
    });
  }

  function scheduleAfterRenderScrollFallback() {
    clearAfterRenderScrollScheduler();
    if (typeof window === "undefined") {
      applyBottomScrollAfterRender();
      return;
    }

    // 고정 시간 타이머 fallback 대신 렌더 이벤트가 누락된 예외 케이스만
    // 다음 paint에서 한 번 보정합니다. history render 경로에서는 호출되지 않습니다.
    afterRenderScrollRafId = window.requestAnimationFrame(() => {
      afterRenderScrollRafId = 0;
      if (pendingAfterRenderAssistantIds) {
        applyBottomScrollAfterRender();
      }
    });
  }

  function scrollToBottomAfterRender(options = {}) {
    clearStableTimers?.();
    clearAfterRenderScrollState();

    const assistantIds = getAssistantMessageIds?.() || [];

    pendingAfterRenderOptions = {...options, force: true, stable: false};
    pendingAfterRenderAssistantIds = new Set(assistantIds);

    if (!pendingAfterRenderAssistantIds.size) {
      applyBottomScrollAfterRender();
      return;
    }

    scheduleAfterRenderScrollFallback();
  }

  function scrollToBottom(options = {}) {
    const force = options.force === true;
    const stable = options.stable === true;
    const behavior = options.behavior || "auto";

    if (props.historyRendering) {
      clearStableTimers?.();
      applyHistoryRenderBottomScroll();
      return;
    }

    if (!force && !userIsAtBottom.value) return;

    clearStableTimers?.();
    applyBottomScroll(behavior);

    if (!stable) return;

    stableScrollDelays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        applyBottomScroll("auto");
      }, delay);
      trackStableTimer?.(timerId);
    });
  }

  function handlePendingAfterRenderMessageRendered(messageId) {
    if (!pendingAfterRenderAssistantIds) return false;

    pendingAfterRenderAssistantIds.delete(String(messageId ?? ""));
    if (!pendingAfterRenderAssistantIds.size) {
      applyBottomScrollAfterRender();
    }
    return true;
  }

  function getIsAtBottom() {
    updateBottomState?.();
    return userIsAtBottom.value;
  }

  return {
    applyBottomScroll,
    applyHistoryRenderBottomScroll,
    applyHistoryRenderInitialScrollTarget,
    clearAfterRenderScrollState,
    getIsAtBottom,
    handlePendingAfterRenderMessageRendered,
    scrollToBottom,
    scrollToBottomAfterRender,
  };
}
