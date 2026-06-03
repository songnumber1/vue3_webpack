import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useMessageFocusSpacer} from "./useMessageFocusSpacer";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/utils/overlayScrollbar";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";

// 사용자가 맨 아래에 있다고 판단할 허용 오차(px)입니다.
// scrollHeight - scrollTop - clientHeight 값이 48px 이하이면
// "거의 맨 아래"로 보고 scroll-bottom 버튼 표시/자동 스크롤 여부 판단에 사용합니다.
const BOTTOM_THRESHOLD = 48;

// 실시간 답변 스트리밍 중 content 높이가 계속 변할 때
// 하단 자동 스크롤을 안정적으로 유지하기 위한 재보정 타이밍(ms)입니다.
// Markdown, code block, table wrapper 등으로 scrollHeight가 늦게 변할 수 있어
// 여러 시점에 scrollToBottom을 재적용합니다.
// history 대화방 최초 진입용이 아니라 streaming 중 자동 스크롤 보정용입니다.
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];

// history 대화방 진입 중 메시지 DOM/Assistant Markdown 렌더 완료 여부를
// 주기적으로 확인하는 간격(ms)입니다.
// pending assistant render, message DOM 개수, content ready 상태를 확인해서
// 준비가 끝나면 Mermaid/OverlayScrollbar/최종 scroll 단계로 넘어갑니다.
const HYDRATION_READY_CHECK_INTERVAL_MS = 120;

// history 대화방 reveal 전에 최소로 기다릴 paint frame 수입니다.
// DOM 생성, Mermaid 렌더, OverlayScrollbar update, scrollToBottom 이후
// 브라우저 layout/paint가 안정될 시간을 주기 위한 값입니다.
const HYDRATION_MIN_READY_PAINT_FRAMES = 2;

// 대용량 history 대화방의 최대 hydration 대기 시간(ms)입니다.
// 메시지/Markdown/Mermaid 렌더 이벤트가 누락되거나 특정 상태가 풀리지 않을 때
// circle progress가 무한히 유지되는 것을 막기 위한 hard timeout입니다.
// 정상 흐름에서는 이 시간까지 기다리지 않고 준비 완료 즉시 진행됩니다.
const HYDRATION_LARGE_ROOM_HARD_TIMEOUT_MS = 12000;

// 소형 history 대화방의 최대 hydration 대기 시간(ms)입니다.
// 대화량이 적은 방에서 렌더 이벤트 누락 등으로 무한 로딩이 되는 것을 막기 위한
// hard timeout입니다. 정상 흐름에서는 준비 완료 즉시 진행됩니다.
const HYDRATION_SMALL_ROOM_HARD_TIMEOUT_MS = 4500;

// resize, composer 높이 변경, PC/모바일 전환 등으로 스크롤 영역 재계산이 필요할 때
// 과도한 반복 계산을 막기 위한 debounce 시간(ms)입니다.
// 연속 resize 이벤트가 발생해도 120ms 단위로 묶어서
// spacer, bottom state, OverlayScrollbar update를 재계산합니다.
const RESIZE_RECALCULATE_DEBOUNCE_MS = 120;

// 모바일, 특히 Android에서 키보드가 열린 상태로 질문을 전송한 뒤
// visualViewport, 주소창, 키보드 애니메이션으로 인해 화면 높이가 늦게 안정되는 문제를
// 보정하기 위한 scrollToBottom 재적용 타이밍(ms)입니다.
// Android keyboard/viewport 특성 대응용이므로 history hydration timeout과는 별도입니다.
const KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS = [
  0, 80, 160, 320, 600, 900, 1300, 1800, 2300,
];

function isAndroidHydrationRuntime() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const ua = navigator.userAgent || "";
  const bodyClassList = document?.body?.classList;
  return (
    /Android/i.test(ua) ||
    Boolean(window.AndroidBridge) ||
    bodyClassList?.contains("android-webview") ||
    bodyClassList?.contains("android-chrome")
  );
}

function canElementScroll(element) {
  if (
    !element ||
    element === document.body ||
    element === document.documentElement
  ) {
    return false;
  }

  const style = window.getComputedStyle(element);
  const overflowY = `${style.overflowY || ""} ${style.overflow || ""}`;
  return (
    /(auto|scroll)/.test(overflowY) &&
    element.scrollHeight > element.clientHeight + 1
  );
}

function getScrollableAncestors(target) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return [];
  }

  const result = [];
  let current = target?.parentElement || null;
  while (
    current &&
    current !== document.body &&
    current !== document.documentElement
  ) {
    if (canElementScroll(current)) result.push(current);
    current = current.parentElement;
  }
  return result;
}

function scrollElementToTarget(container, target, options = {}) {
  if (!container || !target) return false;

  const behavior = options.behavior || "auto";
  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const nextTop =
    container.scrollTop + targetRect.top - containerRect.top - offset;

  if (typeof container.scrollTo === "function") {
    container.scrollTo({top: Math.max(0, nextTop), behavior});
  } else {
    container.scrollTop = Math.max(0, nextTop);
  }
  return true;
}

function applyWindowFallbackScroll(target, containerRect, options = {}) {
  if (!options.pageFallback || typeof window === "undefined") return;

  const behavior = options.behavior || "auto";
  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const targetRect = target.getBoundingClientRect();
  const viewportTop = containerRect?.top || 0;
  const delta = targetRect.top - viewportTop - offset;

  if (Math.abs(delta) < 1) return;
  window.scrollBy({top: delta, behavior});
}

export function useMessageListScroll({props, emit}) {
  const scrollRef = ref(null);
  const bottomRef = ref(null);
  const userIsAtBottom = ref(true);
  let overlayScrollViewport = null;
  let overlayScrollSource = null;
  let stableScrollTimerIds = [];
  let afterRenderScrollTimerId = 0;
  let pendingAfterRenderAssistantIds = null;
  let pendingAfterRenderOptions = null;
  let hydrationRunId = 0;
  let hydrationTimerId = 0;
  let hydrationReadyCheckTimerId = 0;
  let hydrationReadyStartedAt = 0;
  let hydrationReadyPaintFrames = 0;
  let hydrationRafId = 0;
  let hydrationResizeObserver = null;
  let pendingHydrationAssistantIds = null;
  let hydrationCompletingRunId = 0;
  let resizeRecalculateTimerId = 0;
  let resizeRecalculateRafId = 0;
  let trackedRafIds = [];
  let renderedFrameRafId = 0;
  let renderedFrameNeedsSpacer = false;
  let renderedFrameNeedsBottomState = false;
  let latestUserMessageCache = null;
  let latestUserMessageCacheKey = "";

  function getScrollElement() {
    return overlayScrollViewport || scrollRef.value;
  }

  function setupOverlayScrollbar() {
    const element = scrollRef.value;
    if (!element || overlayScrollSource === element) return;

    cleanupOverlayScrollbar();
    overlayScrollSource = element;
    initOverlayScrollbar(element, {
      overflow: {x: "hidden", y: "scroll"},
    });
    overlayScrollViewport = getOverlayScrollbarViewport(element);
    if (overlayScrollViewport && overlayScrollViewport !== element) {
      overlayScrollViewport.addEventListener("scroll", handleScroll, {
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

  function cleanupOverlayScrollbar() {
    if (
      overlayScrollViewport &&
      overlayScrollViewport !== overlayScrollSource
    ) {
      overlayScrollViewport.removeEventListener("scroll", handleScroll);
    }
    if (overlayScrollSource) destroyOverlayScrollbar(overlayScrollSource);
    overlayScrollViewport = null;
    overlayScrollSource = null;
  }

  function getLatestUserMessageKey() {
    const list = props.messages || [];
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const message = list[index];
      if (message?.role === "user") {
        return String(message.id ?? `user-${index}`);
      }
    }
    return "";
  }

  function getLatestUserMessageElement() {
    const el = getScrollElement();
    if (!el) return null;

    const cacheKey = getLatestUserMessageKey();
    if (
      cacheKey &&
      latestUserMessageCacheKey === cacheKey &&
      latestUserMessageCache &&
      el.contains(latestUserMessageCache)
    ) {
      return latestUserMessageCache;
    }

    let target = null;
    if (cacheKey) {
      const escapedKey =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(cacheKey)
          : cacheKey.replace(/"/g, '\\"');
      target = el.querySelector(`[data-message-id="${escapedKey}"]`);
    }

    // ID 기반 조회가 실패한 예외 케이스에서만 전체 DOM 검색으로 폴백합니다.
    // 긴 대화방 resize 중 querySelectorAll을 반복하면 프레임이 크게 밀릴 수 있습니다.
    if (!target) {
      const userMessages = el.querySelectorAll(
        '[data-message-role="user"], article.message--user, .message--user'
      );
      target = userMessages.length
        ? userMessages[userMessages.length - 1]
        : null;
    }

    latestUserMessageCacheKey = cacheKey;
    latestUserMessageCache = target;
    return target;
  }

  const {
    streamFocusSpacerHeight,
    recalculateFocusSpacerHeight,
    refreshFocusSpacerAfterRender,
  } = useMessageFocusSpacer({
    props,
    getScrollElement,
    getLatestUserMessageElement,
  });

  function isNearBottom() {
    const el = getScrollElement();
    if (!el) return true;

    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    return remaining <= BOTTOM_THRESHOLD;
  }

  function updateBottomState() {
    userIsAtBottom.value = isNearBottom();
  }

  function handleScroll() {
    updateBottomState();
  }

  function clearStableTimers() {
    stableScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    stableScrollTimerIds = [];
    clearTrackedAnimationFrames();
  }

  function clearAfterRenderScrollTimer() {
    if (!afterRenderScrollTimerId) return;
    window.clearTimeout(afterRenderScrollTimerId);
    afterRenderScrollTimerId = 0;
  }

  function clearAfterRenderScrollState() {
    clearAfterRenderScrollTimer();
    pendingAfterRenderAssistantIds = null;
    pendingAfterRenderOptions = null;
  }

  function clearHydrationState() {
    hydrationRunId += 1;
    if (hydrationTimerId) {
      window.clearTimeout(hydrationTimerId);
      hydrationTimerId = 0;
    }
    if (hydrationReadyCheckTimerId) {
      window.clearTimeout(hydrationReadyCheckTimerId);
      hydrationReadyCheckTimerId = 0;
    }
    hydrationReadyStartedAt = 0;
    hydrationReadyPaintFrames = 0;
    if (hydrationRafId) {
      window.cancelAnimationFrame(hydrationRafId);
      hydrationRafId = 0;
    }
    clearTrackedAnimationFrames();
    hydrationCompletingRunId = 0;
    hydrationResizeObserver?.disconnect();
    hydrationResizeObserver = null;
    pendingHydrationAssistantIds = null;
  }

  function getAssistantMessageIds() {
    return (props.messages || [])
      .filter((message) => message?.role === "assistant")
      .map((message, index) => String(message.id ?? `assistant-${index}`));
  }

  function handleUserScrollIntent() {
    clearStableTimers();
    clearAfterRenderScrollState();
    if (!props.initialHydrating) {
      clearHydrationState();
    }
  }

  function applyBottomScroll(behavior = "auto") {
    const el = getScrollElement();
    if (!el) return;

    if (bottomRef.value?.scrollIntoView) {
      bottomRef.value.scrollIntoView({
        block: "end",
        inline: "nearest",
        behavior,
      });
    }

    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    userIsAtBottom.value = true;
  }

  function shouldAutoHydrationBottomScroll() {
    // 대화방 이력 진입 시에는 답변 자동 스크롤 설정과 무관하게 항상 마지막 메시지로 이동합니다.
    // autoScrollOnAnswer는 실시간 답변 추적 옵션이고, history hydration의 시작 위치 정책과 분리되어야 합니다.
    return props.initialHydrating === true;
  }

  function applyHydrationBottomScroll() {
    if (!shouldAutoHydrationBottomScroll()) return;

    applyBottomScroll("auto");

    const el = getScrollElement();
    if (!el) return;

    // Android Chrome/WebView에서는 VisualViewport, composer 높이, 폰트/마크다운 높이가
    // 같은 프레임에서 순차 반영될 수 있습니다. 화면은 아직 hidden 상태이므로
    // 사용자에게 스크롤 이동을 노출하지 않고 여러 프레임 안에서 최종 하단 위치만 확정합니다.
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
  }

  function applyElementScroll(target, options = {}) {
    const el = getScrollElement();
    if (!el || !target) return false;

    const ancestors = getScrollableAncestors(target);
    const scrollTargets = [el, ...ancestors].filter(
      (item, index, array) => item && array.indexOf(item) === index
    );

    let applied = false;
    scrollTargets.forEach((container) => {
      applied = scrollElementToTarget(container, target, options) || applied;
    });

    applyWindowFallbackScroll(target, el.getBoundingClientRect(), options);
    updateBottomState();
    return applied;
  }

  function scrollToLatestUserMessage(options = {}) {
    clearStableTimers();

    const target = getLatestUserMessageElement();
    if (!target) return;

    const applyLatestUserAnchor = (anchorOptions = options) => {
      recalculateFocusSpacerHeight(anchorOptions);
      updateOverlayScrollbarFrame();
      return applyElementScroll(target, anchorOptions);
    };

    const applied = applyLatestUserAnchor(options);
    if (!applied) return;

    // 자동 스크롤 OFF + 질문/재생성 직후에는 마지막 질문 박스가 화면 상단에
    // 보여야 합니다. 이때 하단 spacer ref를 먼저 계산해도 DOM에는 다음 tick/paint에
    // 반영되므로, 즉시 scroll만 수행하면 브라우저가 최대 scrollTop으로 clamp하여
    // 질문 박스가 중간/하단에 머무를 수 있습니다.
    // 따라서 manual stream의 최초 앵커 이동에 한해서 spacer DOM 반영 후 짧게 재적용합니다.
    // 예약 타이머는 stableScrollTimerIds로 관리하여 사용자가 wheel/touch로 스크롤하면
    // handleUserScrollIntent()에서 즉시 취소되므로 답변 수신 중 수동 스크롤은 존중됩니다.
    if (props.loading && !props.autoScrollOnAnswer) {
      const delays = options.initialOnly ? [0, 32, 80] : [0, 32, 80, 160];
      delays.forEach((delay) => {
        const timerId = window.setTimeout(() => {
          scheduleTrackedAnimationFrame(() => {
            applyLatestUserAnchor({...options, behavior: "auto"});
          });
        }, delay);
        stableScrollTimerIds.push(timerId);
      });
      return;
    }

    if (!options.stable) return;

    const delays = options.keyboardOpenOnSubmit
      ? KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS
      : STABLE_SCROLL_DELAYS;

    delays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        scheduleTrackedAnimationFrame(() => {
          applyLatestUserAnchor({...options, behavior: "auto"});
        });
      }, delay);
      stableScrollTimerIds.push(timerId);
    });
  }

  function applyBottomScrollAfterRender() {
    const options = pendingAfterRenderOptions || {};
    clearAfterRenderScrollState();

    scheduleTrackedAnimationFrame(() => {
      scheduleTrackedAnimationFrame(() => {
        applyBottomScroll(options.behavior || "auto");
      });
    });
  }

  function waitAnimationFrame() {
    if (typeof window === "undefined") return Promise.resolve();
    return new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  async function waitAnimationFrames(count = 1) {
    for (let index = 0; index < count; index += 1) {
      await waitAnimationFrame();
    }
  }

  async function renderHydrationMermaidBeforeReveal(runId) {
    await nextTick();
    if (runId !== hydrationRunId || !props.initialHydrating) return false;

    await waitAnimationFrames(1);
    if (runId !== hydrationRunId || !props.initialHydrating) return false;

    const root = scrollRef.value;
    if (!root) return true;

    try {
      await renderMermaidInElement(root);
    } catch {
      // Mermaid 문법 오류나 렌더 실패가 있더라도 이력 대화방 hydration은
      // 코드블록 fallback 상태로 계속 완료되어야 합니다.
    }

    if (runId !== hydrationRunId || !props.initialHydrating) return false;
    updateOverlayScrollbarFrame();
    emit("content-rendered");
    return true;
  }

  async function runHydrationRevealScrollSequence(runId) {
    if (runId !== hydrationRunId) return;

    await nextTick();
    if (runId !== hydrationRunId || !props.initialHydrating) return;

    updateOverlayScrollbarFrame();
    applyHydrationBottomScroll();

    const mermaidReady = await renderHydrationMermaidBeforeReveal(runId);
    if (!mermaidReady || runId !== hydrationRunId || !props.initialHydrating)
      return;

    updateOverlayScrollbarFrame();
    applyHydrationBottomScroll();

    await waitAnimationFrames(HYDRATION_MIN_READY_PAINT_FRAMES);
    if (runId !== hydrationRunId || !props.initialHydrating) return;

    updateOverlayScrollbarFrame();
    applyHydrationBottomScroll();
    pendingHydrationAssistantIds = null;
    emit("history-hydrated");
  }

  function completeInitialHydration(runId) {
    if (runId !== hydrationRunId) return;
    if (hydrationCompletingRunId === runId) return;
    hydrationCompletingRunId = runId;

    if (hydrationTimerId) {
      window.clearTimeout(hydrationTimerId);
      hydrationTimerId = 0;
    }
    if (hydrationReadyCheckTimerId) {
      window.clearTimeout(hydrationReadyCheckTimerId);
      hydrationReadyCheckTimerId = 0;
    }

    scheduleTrackedAnimationFrame(() => {
      if (runId !== hydrationRunId) return;

      if (!shouldAutoHydrationBottomScroll()) {
        pendingHydrationAssistantIds = null;
        emit("history-hydrated");
        updateBottomState();
        return;
      }

      runHydrationRevealScrollSequence(runId).catch(() => {
        if (runId !== hydrationRunId || !props.initialHydrating) return;
        pendingHydrationAssistantIds = null;
        emit("history-hydrated");
      });
    });
  }

  function getHydrationHardTimeoutMs() {
    const messageCount = props.messages?.length || 0;
    const assistantCount = getAssistantMessageIds().length;
    const base =
      messageCount >= 120
        ? HYDRATION_LARGE_ROOM_HARD_TIMEOUT_MS
        : HYDRATION_SMALL_ROOM_HARD_TIMEOUT_MS;

    return Math.max(base, Math.min(16000, assistantCount * 24));
  }

  function getHydrationDomMessageCount() {
    const root = scrollRef.value;
    if (!root?.isConnected) return 0;
    return root.querySelectorAll("[data-message-role]").length;
  }

  function isHydrationDomReady() {
    const expectedCount = props.messages?.length || 0;
    if (!expectedCount) return true;
    return getHydrationDomMessageCount() >= expectedCount;
  }

  function isHydrationContentReady() {
    return (
      !pendingHydrationAssistantIds || pendingHydrationAssistantIds.size === 0
    );
  }

  function scheduleHydrationReadyCheck(runId) {
    if (hydrationTimerId) {
      window.clearTimeout(hydrationTimerId);
      hydrationTimerId = 0;
    }
    if (hydrationReadyCheckTimerId) {
      window.clearTimeout(hydrationReadyCheckTimerId);
      hydrationReadyCheckTimerId = 0;
    }

    if (!hydrationReadyStartedAt) {
      hydrationReadyStartedAt = Date.now();
      hydrationReadyPaintFrames = 0;
    }

    const check = () => {
      if (runId !== hydrationRunId || !props.initialHydrating) return;

      const elapsed = Date.now() - hydrationReadyStartedAt;
      const hardTimeoutMs = getHydrationHardTimeoutMs();
      const ready = isHydrationDomReady() && isHydrationContentReady();
      const timedOut = elapsed >= hardTimeoutMs;

      // Windows Chrome에서 500개 내외 대화방은 Markdown/Vue DOM 반영이 fallback 시간보다
      // 늦는 경우가 있습니다. pending assistant가 남아 있으면 progress를 끄지 않고,
      // DOM과 content가 준비된 뒤 최소 2 프레임을 더 기다려 hidden 해제/scroll 계산이
      // 화면에 같이 반영되도록 합니다. 단, 비정상 렌더 이벤트 누락은 hard timeout으로
      // 방어합니다.
      if (ready || timedOut) {
        scheduleTrackedAnimationFrame(() => {
          if (runId !== hydrationRunId || !props.initialHydrating) return;
          hydrationReadyPaintFrames += 1;
          if (hydrationReadyPaintFrames < HYDRATION_MIN_READY_PAINT_FRAMES) {
            scheduleHydrationReadyCheck(runId);
            return;
          }
          completeInitialHydration(runId);
        });
        return;
      }

      hydrationReadyCheckTimerId = window.setTimeout(
        () => scheduleHydrationReadyCheck(runId),
        HYDRATION_READY_CHECK_INTERVAL_MS
      );
    };

    check();
  }

  async function startInitialHydration() {
    if (!props.initialHydrating || typeof window === "undefined") return;

    clearHydrationState();
    const runId = hydrationRunId;
    await nextTick();

    if (runId !== hydrationRunId || !props.initialHydrating) return;

    pendingHydrationAssistantIds = new Set(getAssistantMessageIds());
    if (!pendingHydrationAssistantIds.size) {
      scheduleHydrationReadyCheck(runId);
      return;
    }

    scheduleHydrationReadyCheck(runId);
  }

  function scheduleAfterRenderScrollFallback() {
    clearAfterRenderScrollTimer();
    afterRenderScrollTimerId = window.setTimeout(() => {
      applyBottomScrollAfterRender();
    }, 1200);
  }

  function scrollToBottomAfterRender(options = {}) {
    clearStableTimers();
    clearAfterRenderScrollState();

    const assistantIds = getAssistantMessageIds();

    pendingAfterRenderOptions = {...options, force: true, stable: false};
    pendingAfterRenderAssistantIds = new Set(assistantIds);

    if (!pendingAfterRenderAssistantIds.size) {
      applyBottomScrollAfterRender();
      return;
    }

    scheduleAfterRenderScrollFallback();
  }

  async function finalizeHistoryRevealScroll() {
    // history-hydrated 이벤트 이후 부모가 input/composer를 다시 레이아웃에
    // 참여시키더라도 MessageList는 isHistoryRevealFinalizing으로 계속 hidden
    // 상태를 유지합니다. Android Chrome/WebView는 composer 표시, VisualViewport,
    // OverlayScrollbar viewport 반영이 서로 다른 frame에 안정될 수 있으므로
    // 화면 reveal 전에 여러 frame 동안 최종 하단 위치를 동기화합니다.
    // reveal 이후 delayed scroll correction은 다시 살리지 않습니다.
    const framePasses = isAndroidHydrationRuntime() ? 4 : 2;

    await nextTick();

    for (let index = 0; index < framePasses; index += 1) {
      updateOverlayScrollbarFrame();
      applyBottomScroll("auto");
      await waitAnimationFrames(1);
    }

    updateOverlayScrollbarFrame();
    applyBottomScroll("auto");
    updateBottomState();
  }

  function scrollToBottom(options = {}) {
    const force = options.force === true;
    const stable = options.stable === true;
    const behavior = options.behavior || "auto";

    if (!force && !userIsAtBottom.value) return;

    clearStableTimers();
    applyBottomScroll(behavior);

    if (!stable) return;

    STABLE_SCROLL_DELAYS.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        applyBottomScroll("auto");
      }, delay);
      stableScrollTimerIds.push(timerId);
    });
  }

  function handleMessageRendered(messageId, renderPart = "") {
    if (pendingHydrationAssistantIds) {
      const id = String(messageId ?? "");
      const isLayoutReady =
        !renderPart ||
        renderPart === "content" ||
        renderPart === "layout-ready";
      if (isLayoutReady) pendingHydrationAssistantIds.delete(id);
      if (!pendingHydrationAssistantIds.size) {
        const runId = hydrationRunId;
        scheduleHydrationReadyCheck(runId);
      }
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

    if (pendingAfterRenderAssistantIds) {
      pendingAfterRenderAssistantIds.delete(String(messageId ?? ""));
      if (!pendingAfterRenderAssistantIds.size) {
        applyBottomScrollAfterRender();
      }
      return;
    }

    // 채팅방 입장으로 기존 메시지를 한꺼번에 렌더링하는 동안에는
    // 각 메시지의 rendered 이벤트마다 바닥 스크롤을 반복하지 않습니다.
    // 실시간 답변 스트리밍/typing 상태에서만 기존 자동 스크롤을 유지합니다.
    if (props.loading && props.autoScrollOnAnswer) {
      scrollToBottom({stable: true});
    }
  }

  function getIsAtBottom() {
    updateBottomState();
    return userIsAtBottom.value;
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

    // 긴 대화방(250~1000개)에서 resize 이벤트가 연속 발생할 때마다
    // scrollHeight/getBoundingClientRect/querySelectorAll 계열 계산을 수행하면
    // 화면 전환 반응이 크게 느려집니다. 마지막 resize 프레임 근처에서 한 번만
    // composer spacer와 OverlayScrollbars를 갱신합니다.
    clearResizeRecalculateScheduler();
    resizeRecalculateTimerId = window.setTimeout(() => {
      resizeRecalculateTimerId = 0;
      resizeRecalculateRafId = window.requestAnimationFrame(() => {
        resizeRecalculateRafId = 0;
        recalculateFocusSpacerHeight();
        updateOverlayScrollbarFrame();
        updateBottomState();
      });
    }, RESIZE_RECALCULATE_DEBOUNCE_MS);
  }

  watch(
    () => [
      props.loading,
      props.autoScrollOnAnswer,
      props.messages.length,
      props.initialHydrating,
    ],
    ([loading, autoScrollOnAnswer, , initialHydrating]) => {
      latestUserMessageCache = null;
      latestUserMessageCacheKey = "";

      if (initialHydrating) {
        scheduleRenderedFrameUpdate({spacer: false});
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
    () => [props.initialHydrating, props.messages.length],
    () => {
      if (props.initialHydrating) {
        startInitialHydration();
      } else {
        clearHydrationState();
      }
    },
    {flush: "post"}
  );

  onMounted(() => {
    if (typeof window === "undefined") return;
    setupOverlayScrollbar();
    recalculateFocusSpacerHeight();
    if (props.initialHydrating) startInitialHydration();
    window.addEventListener("resize", scheduleResizeRecalculate, {
      passive: true,
    });
    window.visualViewport?.addEventListener(
      "resize",
      scheduleResizeRecalculate,
      {passive: true}
    );
    window.addEventListener("touchstart", handleUserScrollIntent, {
      passive: true,
    });
    window.addEventListener("wheel", handleUserScrollIntent, {passive: true});
  });

  onBeforeUnmount(() => {
    clearStableTimers();
    clearAfterRenderScrollState();
    clearHydrationState();
    clearRenderedFrameScheduler();
    clearTrackedAnimationFrames();
    clearResizeRecalculateScheduler();
    cleanupOverlayScrollbar();
    if (typeof window === "undefined") return;
    window.removeEventListener("resize", scheduleResizeRecalculate);
    window.visualViewport?.removeEventListener(
      "resize",
      scheduleResizeRecalculate
    );
    window.removeEventListener("touchstart", handleUserScrollIntent);
    window.removeEventListener("wheel", handleUserScrollIntent);
  });

  return {
    scrollRef,
    bottomRef,
    streamFocusSpacerHeight,
    handleScroll,
    handleUserScrollIntent,
    handleMessageRendered,
    scrollToBottom,
    scrollToBottomAfterRender,
    scrollToLatestUserMessage,
    finalizeHistoryRevealScroll,
    getIsAtBottom,
    getScrollElement,
  };
}
