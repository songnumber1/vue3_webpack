import {onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useMessageFocusSpacer} from "./useMessageFocusSpacer";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {createMessageScrollTargetController} from "./useMessageScrollTarget";
import {
  isAndroidHistoryRenderRuntime,
  shouldUseManualHistoryLoadMode,
} from "./messageListScrollUtils";
import {createMessageLazyPrependScrollController} from "./useMessageLazyPrependScroll";
import {createMessageOverlayScrollSyncController} from "./useMessageOverlayScrollSync";
import {
  createLatestUserMessageElementFinder,
  createMessageTargetScrollController,
} from "./useMessageTargetScroll";
import {createMessageBottomScrollController} from "./useMessageBottomScroll";
import {createMessageUserScrollIntentController} from "./useMessageUserScrollIntent";
import {createMessageResizeRecalculateController} from "./useMessageResizeRecalculate";
import {createMessageHistoryRenderReadinessController} from "./useMessageHistoryRenderReadiness";
import {createMessageHistoryPostProcessController} from "./useMessageHistoryPostProcess";
import {createMessageHistoryRenderLifecycleController} from "./useMessageHistoryRenderLifecycle";
import {
  BOTTOM_THRESHOLD,
  KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS,
  RESIZE_RECALCULATE_DEBOUNCE_MS,
  STABLE_SCROLL_DELAYS,
} from "./messageListScrollConstants";
import {createPreviousHistoryLazyLoadController} from "./usePreviousHistoryLazyLoad";
import {createMessageListScrollPublicContract} from "./useMessageListScrollPublicContract";

// Role map for the scroll refactor. This file remains the public orchestrator
// for MessageList scroll behavior; step 1 only labels stable boundaries so
// later helper extraction can happen without changing execution order.
// Android Chrome/WebView native scrolling keeps momentum after a fast fling.
// Auto prepend during native scrolling is unstable, so Android uses a manual
// "load previous history" button. PC keeps the existing automatic threshold path.

function isMermaidRenderingEnabled() {
  return isMermaidRenderingEnabledForPlatform(getRuntimeSystemSettings());
}

/**
 * MessageList scroll orchestrator.
 *
 * Public contract intentionally stays unchanged in this refactor stage.
 * Callers still receive the same refs, event handlers, and scroll commands;
 * only internal role boundaries are documented below for safe extraction.
 */
export function useMessageListScroll({props, emit}) {
  const scrollRef = ref(null);
  const bottomRef = ref(null);
  const userIsAtBottom = ref(true);
  let stableScrollTimerIds = [];
  let historyRenderRunId = 0;
  let historyRenderCompleting = false;
  const previousHistoryLoadInProgress = ref(false);
  const androidManualHistoryLoadMode = ref(false);
  const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
  let historyLazyScrollRestoreUntil = 0;
  let hasProgressiveHistoryMarkdownRevealed = () => false;
  let resetHistoryRenderLifecycleState = () => {};

  // -------------------------------------------------------------------------
  // Runtime state guards and scroll element accessors
  // -------------------------------------------------------------------------
  function isHistoryLazyScrollRestoreSuppressed() {
    return (
      historyLazyScrollRestoreUntil > 0 &&
      typeof Date !== "undefined" &&
      Date.now() < historyLazyScrollRestoreUntil
    );
  }

  function suppressHistoryLazyScrollRestore(duration = 260) {
    if (typeof Date === "undefined") return;
    historyLazyScrollRestoreUntil = Date.now() + duration;
  }

  // -------------------------------------------------------------------------
  // OverlayScrollbar lifecycle and rendered-frame scheduling
  // -------------------------------------------------------------------------
  const {
    clearRenderedFrameScheduler,
    clearTrackedAnimationFrames,
    cleanupOverlayScrollbar,
    getScrollElement,
    scheduleRenderedFrameUpdate,
    scheduleTrackedAnimationFrame,
    setupOverlayScrollbar,
    updateOverlayScrollbarFrame,
  } = createMessageOverlayScrollSyncController({
    emit,
    onScroll: handleScroll,
    recalculateFocusSpacerHeight: (...args) =>
      recalculateFocusSpacerHeight(...args),
    scrollRef,
    updateBottomState,
    shouldUseOverlayScrollbar: () => shouldUseOverlayScrollbar.value,
  });

  // -------------------------------------------------------------------------
  // Latest user-message lookup and focus spacer integration
  // -------------------------------------------------------------------------
  const {getLatestUserMessageElement, resetLatestUserMessageCache} =
    createLatestUserMessageElementFinder({
      props,
      getScrollElement,
    });

  const {
    streamFocusSpacerHeight,
    recalculateFocusSpacerHeight,
    refreshFocusSpacerAfterRender,
  } = useMessageFocusSpacer({
    props,
    getScrollElement,
    getLatestUserMessageElement,
  });

  // -------------------------------------------------------------------------
  // Bottom state and message target controller
  // -------------------------------------------------------------------------
  function isNearBottom() {
    const el = getScrollElement();
    if (!el) return true;

    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    return remaining <= BOTTOM_THRESHOLD;
  }

  function updateBottomState() {
    userIsAtBottom.value = isNearBottom();
  }

  const messageScrollTarget = createMessageScrollTargetController({
    getScrollElement,
    getScrollRoot: () => scrollRef.value,
    getBottomElement: () => bottomRef.value,
    updateBottomState,
  });

  const {scrollToInitialTarget, scrollToLatestUserMessage} =
    createMessageTargetScrollController({
      props,
      getScrollElement,
      getLatestUserMessageElement,
      messageScrollTarget,
      recalculateFocusSpacerHeight,
      updateBottomState,
      updateOverlayScrollbarFrame,
      clearStableTimers,
      scheduleTrackedAnimationFrame,
      trackStableTimer: (timerId) => stableScrollTimerIds.push(timerId),
      stableScrollDelays: STABLE_SCROLL_DELAYS,
      keyboardSubmitStableScrollDelays: KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS,
    });

  // -------------------------------------------------------------------------
  // History-render strategy and platform mode policy
  // -------------------------------------------------------------------------
  function refreshManualHistoryLoadMode() {
    androidManualHistoryLoadMode.value = shouldUseManualHistoryLoadMode();
  }

  function getHistoryRenderStrategy() {
    return String(props.messageRenderPolicy?.historyRenderStrategy || "");
  }

  function isProgressiveHistoryRender() {
    return getHistoryRenderStrategy().startsWith("pc-progressive-");
  }

  function shouldApplyHistoryRenderScroll(options = {}) {
    if (props.historyRendering !== true) return false;
    if (!isProgressiveHistoryRender()) return true;
    if (options.initialReveal === true) return true;
    if (!hasProgressiveHistoryMarkdownRevealed()) return true;

    // PC progress OFF mode reveals Markdown first and applies the target scroll once.
    // Mermaid/table/code post-processing may change heights afterward, but should not
    // force the viewport again because fast content visibility is the priority.
    return false;
  }

  // -------------------------------------------------------------------------
  // User scroll handling and previous-history lazy loading
  // -------------------------------------------------------------------------
  function handleScroll() {
    updateBottomState();

    // Android Chrome/WebView는 빠른 native fling 중 DOM prepend가 발생하면
    // 브라우저 관성 스크롤과 수동 scrollTop 보정이 충돌할 수 있습니다.
    // 실제 Android 런타임에서는 자동 상단 lazy load를 사용하지 않고,
    // 메시지 목록 최상단의 명시적 버튼으로만 이전 대화를 불러옵니다.
    refreshManualHistoryLoadMode();
    if (androidManualHistoryLoadMode.value) {
      return;
    }

    if (isHistoryLazyScrollRestoreSuppressed()) return;
    void requestPreviousHistoryMessagesIfNeeded();
  }

  // -------------------------------------------------------------------------
  // History lazy-load viewport anchor controller
  // -------------------------------------------------------------------------
  const {
    cancelManualHistoryAnchorLock,
    getHistoryLazyViewportAnchor,
    restoreHistoryLazyViewportAnchor,
    restoreHistoryLazyViewportAnchorByViewport,
    startManualHistoryAnchorLock,
  } = createMessageLazyPrependScrollController({
    suppressHistoryLazyScrollRestore,
    updateBottomState,
    updateOverlayScrollbarFrame,
  });

  // -------------------------------------------------------------------------
  // Scheduler cleanup and history render reset helpers
  // -------------------------------------------------------------------------
  function clearStableTimers() {
    stableScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    stableScrollTimerIds = [];
    clearTrackedAnimationFrames();
  }

  function clearHistoryRenderState() {
    historyRenderRunId += 1;
    clearTrackedAnimationFrames();
    historyRenderCompleting = false;
    resetHistoryRenderLifecycleState();
  }

  // -------------------------------------------------------------------------
  // Previous-history request flow
  // -------------------------------------------------------------------------
  const {
    requestPreviousHistoryMessagesIfNeeded,
    handleManualPreviousHistoryLoad,
  } = createPreviousHistoryLazyLoadController({
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
  });

  // -------------------------------------------------------------------------
  // Message identity and user-scroll intent helpers
  // -------------------------------------------------------------------------
  function getHistoryRenderMessageKey(message, index) {
    return String(message?.id ?? `${message?.role || "message"}-${index}`);
  }

  function getAssistantMessageIds() {
    return (props.messages || [])
      .map((message, index) => ({message, index}))
      .filter(({message}) => message?.role === "assistant")
      .map(({message, index}) => getHistoryRenderMessageKey(message, index));
  }

  const {
    createHistoryRenderDomIndex,
    getPendingHistoryRenderMermaidTargets,
    isHistoryRenderPostProcessReady,
    isProgressiveHistoryRenderInitialReady,
  } = createMessageHistoryRenderReadinessController({
    props,
    scrollRef,
    getScrollElement,
    getHistoryRenderMessageKey,
    isMermaidRenderingEnabled,
  });

  const {
    applyBottomScroll,
    applyHistoryRenderBottomScroll,
    applyHistoryRenderInitialScrollTarget,
    clearAfterRenderScrollState,
    getIsAtBottom,
    handlePendingAfterRenderMessageRendered,
    scrollToBottom,
    scrollToBottomAfterRender,
  } = createMessageBottomScrollController({
    props,
    userIsAtBottom,
    messageScrollTarget,
    updateBottomState,
    shouldApplyHistoryRenderScroll,
    getAssistantMessageIds,
    scheduleTrackedAnimationFrame,
    clearStableTimers,
    stableScrollDelays: STABLE_SCROLL_DELAYS,
    trackStableTimer: (timerId) => stableScrollTimerIds.push(timerId),
  });

  // -------------------------------------------------------------------------
  // History post-processing and layout stability controller
  // -------------------------------------------------------------------------
  const {
    finalizeHistoryRenderPostProcess,
    renderHistoryRoomPendingMermaidSequentially,
    waitForHistoryRenderLayoutStability,
  } = createMessageHistoryPostProcessController({
    props,
    scrollRef,
    bottomRef,
    getScrollElement,
    getPendingHistoryRenderMermaidTargets,
    getHistoryRenderRunId: () => historyRenderRunId,
    isAndroidHistoryRenderRuntime,
    isMermaidRenderingEnabled,
    updateOverlayScrollbarFrame,
    applyHistoryRenderBottomScroll,
  });

  const historyRenderLifecycle = createMessageHistoryRenderLifecycleController({
    props,
    emit,
    getHistoryRenderRunId: () => historyRenderRunId,
    setHistoryRenderCompleting: (value) => {
      historyRenderCompleting = value;
    },
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
  });

  hasProgressiveHistoryMarkdownRevealed =
    historyRenderLifecycle.hasProgressiveHistoryMarkdownRevealed;
  resetHistoryRenderLifecycleState =
    historyRenderLifecycle.resetHistoryRenderLifecycleState;
  const {runHistoryRenderThenScrollSequence} = historyRenderLifecycle;

  const {
    addUserScrollIntentListeners,
    handleUserScrollIntent,
    removeUserScrollIntentListeners,
  } = createMessageUserScrollIntentController({
    cancelManualHistoryAnchorLock,
    clearAfterRenderScrollState,
    clearHistoryRenderState,
    clearStableTimers,
    getIsHistoryRendering: () => props.historyRendering,
  });

  // -------------------------------------------------------------------------
  // Resize recalculation scheduling controller
  // -------------------------------------------------------------------------
  const {clearResizeRecalculateScheduler, scheduleResizeRecalculate} =
    createMessageResizeRecalculateController({
      debounceMs: RESIZE_RECALCULATE_DEBOUNCE_MS,
      getIsHistoryRendering: () => props.historyRendering,
      recalculateFocusSpacerHeight,
      refreshManualHistoryLoadMode,
      updateBottomState,
      updateOverlayScrollbarFrame,
    });

  // -------------------------------------------------------------------------
  // History render lifecycle sequence
  // -------------------------------------------------------------------------
  async function startHistoryRoomRender() {
    if (!props.historyRendering || !props.historyMessagesReady) return;
    if (historyRenderCompleting) return;

    clearHistoryRenderState();
    const runId = historyRenderRunId;
    historyRenderCompleting = true;

    await runHistoryRenderThenScrollSequence(runId);
  }

  // -------------------------------------------------------------------------
  // Public scroll commands used by MessageList/ChatContainer
  // -------------------------------------------------------------------------
  // Message rendered events and streaming scroll behavior
  // -------------------------------------------------------------------------
  function handleMessageRendered(messageId, renderPart = "") {
    if (props.historyRendering) {
      // 채팅방 입장 중에는 메시지별 rendered 이벤트를 누적 상태로 관리하지 않습니다.
      // API 완료 플래그가 켜진 뒤 startHistoryRoomRender()의 단일 try/finally 루프가
      // 현재 v-for DOM 전체를 순차 처리합니다.
      if (props.historyMessagesReady) startHistoryRoomRender();
      return;
    }

    const shouldRecalculateSpacer = !(
      props.loading && !props.autoScrollOnAnswer
    );
    scheduleRenderedFrameUpdate({spacer: shouldRecalculateSpacer});

    if (
      renderPart === "enhanced" &&
      props.autoScrollOnAnswer &&
      userIsAtBottom.value
    ) {
      scheduleTrackedAnimationFrame(() => applyBottomScroll("auto"));
      return;
    }

    if (handlePendingAfterRenderMessageRendered(messageId)) {
      return;
    }

    // 채팅방 입장으로 기존 메시지를 한꺼번에 렌더링하는 동안에는
    // 각 메시지의 rendered 이벤트마다 바닥 스크롤을 반복하지 않습니다.
    // 실시간 답변 스트리밍/typing 상태에서만 기존 자동 스크롤을 유지합니다.
    if (props.loading && props.autoScrollOnAnswer) {
      scrollToBottom({stable: true});
    }
  }

  // -------------------------------------------------------------------------
  // Watchers and DOM lifecycle
  // -------------------------------------------------------------------------
  watch(
    () => [
      props.loading,
      props.autoScrollOnAnswer,
      props.messages.length,
      props.historyRendering,
      props.historyMessagesReady,
    ],
    ([loading, autoScrollOnAnswer, , historyRendering]) => {
      resetLatestUserMessageCache();

      if (historyRendering) {
        // history render 중에는 content-rendered 이벤트/부모 타이머를 만들지 않고,
        // MessageList 내부 직렬 루프에서 overlay/scroll 상태만 갱신합니다.
        updateOverlayScrollbarFrame();
        return;
      }

      updateOverlayScrollbarFrame();

      // 자동 스크롤 OFF로 답변을 생성하는 동안에는 질문 직후 scrollToLatestUserMessage()가
      // 계산한 spacer를 그대로 유지합니다. watch에서 비동기로 다시 계산하면 답변 높이가
      // 아직 충분히 차기 전 scrollHeight 변화와 맞물려 질문 박스가 상단에서 흔들릴 수 있습니다.
      // 생성 종료 또는 자동 스크롤 ON 전환 시에는 아래 호출로 spacer가 0으로 정리됩니다.
      if (loading && !autoScrollOnAnswer) return;

      refreshFocusSpacerAfterRender();
    }
  );

  watch(
    () => [
      props.historyRendering,
      props.historyMessagesReady,
      props.messages.length,
    ],
    () => {
      if (props.historyRendering && props.historyMessagesReady) {
        startHistoryRoomRender();
      } else if (!props.historyRendering) {
        clearHistoryRenderState();
      }
    },
    {flush: "post"}
  );

  onMounted(() => {
    if (typeof window === "undefined") return;
    refreshManualHistoryLoadMode();
    setupOverlayScrollbar();
    recalculateFocusSpacerHeight();
    if (props.historyRendering && props.historyMessagesReady)
      startHistoryRoomRender();
    window.addEventListener("resize", scheduleResizeRecalculate, {
      passive: true,
    });
    window.visualViewport?.addEventListener(
      "resize",
      scheduleResizeRecalculate,
      {passive: true}
    );
    addUserScrollIntentListeners(window);
  });

  onBeforeUnmount(() => {
    clearStableTimers();
    clearAfterRenderScrollState();
    clearHistoryRenderState();
    clearRenderedFrameScheduler();
    clearTrackedAnimationFrames();
    clearResizeRecalculateScheduler();
    cancelManualHistoryAnchorLock();
    cleanupOverlayScrollbar();
    if (typeof window === "undefined") return;
    window.removeEventListener("resize", scheduleResizeRecalculate);
    window.visualViewport?.removeEventListener(
      "resize",
      scheduleResizeRecalculate
    );
    removeUserScrollIntentListeners(window);
  });

  // -------------------------------------------------------------------------
  // Public return contract. Keep these names stable for callers.
  // -------------------------------------------------------------------------
  return createMessageListScrollPublicContract({
    scrollRef,
    bottomRef,
    streamFocusSpacerHeight,
    androidManualHistoryLoadMode,
    previousHistoryLoadInProgress,
    handleScroll,
    handleUserScrollIntent,
    handleManualPreviousHistoryLoad,
    handleMessageRendered,
    scrollToBottom,
    scrollToBottomAfterRender,
    scrollToInitialTarget,
    scrollToLatestUserMessage,
    getIsAtBottom,
    getScrollElement,
  });
}
