import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useMessageFocusSpacer} from "./useMessageFocusSpacer";
import {
  fallbackPendingMermaidToCode,
  renderMermaidInElement,
} from "@/utils/mermaidRenderer";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {createMessageScrollTargetController} from "./useMessageScrollTarget";
import {MESSAGE_SCROLL_TARGET_TYPES} from "./useMessageRenderPolicy";
import {
  isAndroidHistoryRenderRuntime,
  countMermaidBlocksInText,
  isAssistantErrorMessage,
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

const BOTTOM_THRESHOLD = 48;
const DEFAULT_HISTORY_LAZY_TOP_THRESHOLD = 96;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];
const HISTORY_RENDER_READY_STABLE_FRAMES = 3;
const HISTORY_RENDER_DOM_READY_MAX_FRAMES = 360;
const HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES = 720;
const HISTORY_RENDER_LAYOUT_STABLE_FRAMES = 4;
const HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES = 6;
const HISTORY_RENDER_LAYOUT_MAX_FRAMES = 180;
const HISTORY_RENDER_ANDROID_LAYOUT_MAX_FRAMES = 300;
const HISTORY_RENDER_MERMAID_BATCH_SIZE = 12;
const RESIZE_RECALCULATE_DEBOUNCE_MS = 120;
const KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS = [
  0, 80, 160, 320, 600, 900, 1300, 1800, 2300,
];

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
  let progressiveHistoryMarkdownRevealed = false;

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
    if (!progressiveHistoryMarkdownRevealed) return true;

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
    progressiveHistoryMarkdownRevealed = false;
  }

  // -------------------------------------------------------------------------
  // Previous-history request flow
  // -------------------------------------------------------------------------
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

  function blurHistoryLoadMoreTrigger(event) {
    const target = event?.currentTarget || event?.target || null;
    if (typeof target?.blur === "function") {
      target.blur();
    }
    const active =
      typeof document !== "undefined" ? document.activeElement : null;
    if (
      active &&
      active !== document.body &&
      typeof active.blur === "function"
    ) {
      active.blur();
    }
  }

  function handleManualPreviousHistoryLoad(event) {
    blurHistoryLoadMoreTrigger(event);
    return requestPreviousHistoryMessagesIfNeeded({force: true, manual: true});
  }

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
  // History render readiness checks
  // -------------------------------------------------------------------------
  function waitAnimationFrame() {
    if (typeof window === "undefined") return Promise.resolve();
    return new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  async function waitAnimationFrames(count = 1) {
    for (let index = 0; index < count; index += 1) {
      await waitAnimationFrame();
    }
  }

  function createHistoryRenderDomIndex() {
    const root = scrollRef.value;
    const messages = props.messages || [];
    const messageElements = root?.isConnected
      ? Array.from(root.querySelectorAll("[data-message-id]"))
      : [];
    const elementById = new Map();

    messageElements.forEach((element) => {
      const id = element.getAttribute("data-message-id");
      if (id && !elementById.has(id)) {
        elementById.set(id, element);
      }
    });

    return {
      root,
      messages,
      messageElements,
      elementById,
    };
  }

  function getHistoryRenderMessageElementFromIndex(domIndex, message, index) {
    if (!domIndex?.root?.isConnected) return null;

    const key = getHistoryRenderMessageKey(message, index);
    const exactElement = domIndex.elementById.get(key);
    if (exactElement?.isConnected) return exactElement;

    // 예외적으로 message.id가 비어 있거나 DOM id가 달라진 경우에만 v-for 순서를 사용합니다.
    // 매 메시지마다 querySelector를 다시 수행하지 않고, 한 번 수집한 DOM 배열에서만 조회합니다.
    const fallbackElement = domIndex.messageElements[index];
    if (
      fallbackElement?.isConnected &&
      String(fallbackElement.getAttribute("data-message-role") || "") ===
        String(message?.role || "")
    ) {
      return fallbackElement;
    }

    return null;
  }

  function hasRenderedMarkdownElement(element, selector) {
    const target = element?.querySelector?.(selector);
    if (!target) return false;

    // AssistantMessage는 최초 mount 시점에 빈 placeholder DOM이 먼저 존재할 수 있습니다.
    // Android 최초 진입에서는 이 placeholder를 실제 Markdown 완료로 오판하면
    // Mermaid target이 생성되기 전에 history render가 끝나므로, 명시적인 완료 플래그를 우선 확인합니다.
    if (target.getAttribute("data-markdown-rendered") !== "true") {
      return false;
    }

    return target.childNodes.length > 0 || target.textContent.trim().length > 0;
  }

  function getExpectedHistoryRenderMermaidCount() {
    if (!isMermaidRenderingEnabled()) return 0;
    return (props.messages || []).reduce((count, message) => {
      if (
        !message ||
        message.role !== "assistant" ||
        isAssistantErrorMessage(message)
      ) {
        return count;
      }

      return (
        count +
        countMermaidBlocksInText(message.content) +
        countMermaidBlocksInText(message.reasoningContent)
      );
    }, 0);
  }

  function isHistoryRenderMermaidDomReady(root = scrollRef.value) {
    const expectedCount = getExpectedHistoryRenderMermaidCount();
    if (expectedCount <= 0) return true;
    if (!root?.isConnected) return false;

    const mermaidNodes = root.querySelectorAll(
      ".md-mermaid[data-mermaid-pending], .md-mermaid[data-processed], .md-mermaid[data-mermaid-error]"
    );
    return mermaidNodes.length >= expectedCount;
  }

  function isHistoryRenderMessageMarkdownReady(domIndex, index) {
    const message = domIndex?.messages?.[index];
    if (!message) return false;

    const element = getHistoryRenderMessageElementFromIndex(
      domIndex,
      message,
      index
    );
    if (!element?.isConnected) return false;

    if (message?.role !== "assistant" || isAssistantErrorMessage(message)) {
      return true;
    }

    if (message?.reasoningContent) {
      if (
        !hasRenderedMarkdownElement(element, ".reasoning-content.markdown-body")
      ) {
        return false;
      }
    }

    if (message?.content) {
      if (
        !hasRenderedMarkdownElement(element, ".bubble-content.markdown-body")
      ) {
        return false;
      }
    }

    return true;
  }

  function isHistoryRenderContentReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    const {messages} = domIndex;
    for (let index = 0; index < messages.length; index += 1) {
      if (!isHistoryRenderMessageMarkdownReady(domIndex, index)) {
        return false;
      }
    }
    return true;
  }

  function getProgressiveInitialReadyMessageIndexes(domIndex) {
    const messages = domIndex?.messages || [];
    if (!messages.length) return [];

    const target = props.messageRenderPolicy?.scrollTarget || {
      type: MESSAGE_SCROLL_TARGET_TYPES.bottom,
    };

    if (target.type === MESSAGE_SCROLL_TARGET_TYPES.first) {
      return [0];
    }

    if (target.type === MESSAGE_SCROLL_TARGET_TYPES.message) {
      const messageId = String(target.messageId || "").trim();
      const targetIndex = messages.findIndex(
        (message, index) =>
          String(message?.id || "") === messageId ||
          getHistoryRenderMessageKey(message, index) === messageId
      );
      return targetIndex >= 0 ? [targetIndex] : [];
    }

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "assistant") return [index];
    }
    return [messages.length - 1];
  }

  function isHistoryRenderBaseReady(domIndex = createHistoryRenderDomIndex()) {
    const {root} = domIndex;
    if (!root?.isConnected) return false;
    if (!isHistoryRenderRootLayoutReady(root)) return false;
    if (!props.historyMessagesReady) return false;
    return true;
  }

  function isProgressiveHistoryRenderInitialReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    if (!isHistoryRenderBaseReady(domIndex)) return false;

    const indexes = getProgressiveInitialReadyMessageIndexes(domIndex);
    if (!indexes.length) return true;

    return indexes.every((index) =>
      isHistoryRenderMessageMarkdownReady(domIndex, index)
    );
  }

  function isHistoryRenderRootLayoutReady(root) {
    if (!root?.isConnected) return false;

    const scrollElement = getScrollElement();
    const layoutTarget = scrollElement || root;
    const rect = layoutTarget.getBoundingClientRect?.();

    return Boolean(
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      layoutTarget.clientWidth > 0 &&
      layoutTarget.clientHeight > 0
    );
  }

  function isHistoryRenderDomReady(domIndex = createHistoryRenderDomIndex()) {
    const {root, messages, messageElements} = domIndex;
    if (!root?.isConnected) return false;
    if (!isHistoryRenderRootLayoutReady(root)) return false;
    if (!props.historyMessagesReady) return false;
    if (messageElements.length < messages.length) return false;

    for (let index = 0; index < messages.length; index += 1) {
      if (
        !getHistoryRenderMessageElementFromIndex(
          domIndex,
          messages[index],
          index
        )?.isConnected
      ) {
        return false;
      }
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // Mermaid post-processing during history render
  // -------------------------------------------------------------------------
  function getPendingHistoryRenderMermaidTargets(root = scrollRef.value) {
    if (!isMermaidRenderingEnabled()) return [];
    if (!root?.isConnected) return [];
    return Array.from(
      root.querySelectorAll('.md-mermaid[data-mermaid-pending="true"]')
    ).filter((target) => target.isConnected);
  }

  async function updateHistoryRenderFrameAfterBatch(processedCount = 0) {
    if (processedCount % HISTORY_RENDER_MERMAID_BATCH_SIZE !== 0) return;
    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
    await nextTick();
    await waitAnimationFrames(1);
  }

  function isHistoryRenderMarkdownReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    return (
      isHistoryRenderDomReady(domIndex) && isHistoryRenderContentReady(domIndex)
    );
  }

  function isHistoryRenderPostProcessReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    return (
      isHistoryRenderMarkdownReady(domIndex) &&
      isHistoryRenderMermaidDomReady(domIndex.root)
    );
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
      if (runId !== historyRenderRunId || !props.historyRendering) return false;

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

  async function renderHistoryRoomPendingMermaidSequentially(runId) {
    await nextTick();
    if (runId !== historyRenderRunId || !props.historyRendering) return false;

    await waitAnimationFrames(1);
    if (runId !== historyRenderRunId || !props.historyRendering) return false;

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
      // 전체 assistant 메시지를 다시 순회하지 않습니다.
      // v-for로 생성된 DOM 안에서 실제 후처리가 필요한 Mermaid pending block만
      // DOM 순서대로 한 번 처리합니다. Mermaid 내부 함수는 전역 queue를 사용하지 않고,
      // 각 target 실패 시 원본 코드 fallback으로 확정합니다.
      await renderMermaidInElement(root, {
        // Android 최초 로그인/최초 채팅방 진입에서는 번들 Mermaid가 준비되어 있어도
        // 첫 paint 직후 render API가 일시 실패하는 경우가 있어, setTimeout 없이 RAF 기반으로만
        // 같은 target을 짧게 재시도한 뒤 최종 실패 시 code fallback으로 확정합니다.
        renderRetryCount: isAndroidHistoryRenderRuntime() ? 3 : 1,
        renderRetryFrameGap: isAndroidHistoryRenderRuntime() ? 2 : 1,
        onTargetComplete: async (_target, processedCount) => {
          if (runId !== historyRenderRunId || !props.historyRendering) return;
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

  // -------------------------------------------------------------------------
  // Layout stability checks after render/post-process
  // -------------------------------------------------------------------------
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
      if (runId !== historyRenderRunId || !props.historyRendering) return false;

      await waitAnimationFrames(1);
      if (runId !== historyRenderRunId || !props.historyRendering) return false;

      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();
      await nextTick();
      if (runId !== historyRenderRunId || !props.historyRendering) return false;

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

    // table/code/CSV 버튼 등으로 높이가 미세하게 계속 변해도 progress가 고착되지 않도록
    // 최대 프레임 이후에는 현재 DOM 기준으로 마지막 하단 스크롤을 확정하고 진행합니다.
    updateOverlayScrollbarFrame();
    applyHistoryRenderBottomScroll();
    return true;
  }

  // -------------------------------------------------------------------------
  // History render orchestration sequence
  // -------------------------------------------------------------------------
  async function runHistoryRenderThenScrollSequence(runId) {
    try {
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      await nextTick();
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      setupOverlayScrollbar();
      updateOverlayScrollbarFrame();

      await waitForHistoryRenderDomReady(runId);
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      const didRevealProgressiveMarkdown =
        await revealProgressiveHistoryMarkdownIfReady();
      if (
        didRevealProgressiveMarkdown &&
        runId === historyRenderRunId &&
        props.historyRendering &&
        typeof props.continueProgressiveInitialHistoryRender === "function"
      ) {
        await props.continueProgressiveInitialHistoryRender();
        if (runId !== historyRenderRunId || !props.historyRendering) return;
        await nextTick();
        updateOverlayScrollbarFrame();
        applyHistoryRenderInitialScrollTarget({initialReveal: true});
      }

      await renderHistoryRoomPendingMermaidSequentially(runId);
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      recalculateFocusSpacerHeight();
      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();

      if (!isProgressiveHistoryRender()) {
        await waitForHistoryRenderLayoutStability(runId);
        if (runId !== historyRenderRunId || !props.historyRendering) return;

        updateOverlayScrollbarFrame();
        applyHistoryRenderBottomScroll();
        await nextTick();
        await waitAnimationFrames(2);
        applyHistoryRenderBottomScroll();
      }
      updateBottomState();
    } finally {
      historyRenderCompleting = false;
      if (runId === historyRenderRunId && props.historyRendering) {
        const root = scrollRef.value;
        fallbackPendingMermaidToCode(root);
        updateOverlayScrollbarFrame();
        applyHistoryRenderBottomScroll();
        emit("history-rendered");
      }
    }
  }

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
  return {
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
  };
}
