import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useMessageFocusSpacer} from "./useMessageFocusSpacer";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/utils/overlayScrollbar";

const BOTTOM_THRESHOLD = 48;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];
const HYDRATION_REVEAL_SCROLL_DELAYS = [0, 32, 80, 120];
const ANDROID_HYDRATION_REVEAL_SCROLL_DELAYS = [0, 32, 80, 160, 240];
const POST_REVEAL_SCROLL_DELAYS = [80, 180, 320];
const ANDROID_POST_REVEAL_SCROLL_DELAYS = [80, 180, 320, 520];
const HYDRATION_REVEAL_FALLBACK_MS = 180;
const ANDROID_HYDRATION_REVEAL_FALLBACK_MS = 320;
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
  let hydrationRafId = 0;
  let hydrationResizeObserver = null;
  let hydrationRevealTimerIds = [];
  let pendingHydrationAssistantIds = null;

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

  function cleanupOverlayScrollbar() {
    if (overlayScrollViewport && overlayScrollViewport !== overlayScrollSource) {
      overlayScrollViewport.removeEventListener("scroll", handleScroll);
    }
    if (overlayScrollSource) destroyOverlayScrollbar(overlayScrollSource);
    overlayScrollViewport = null;
    overlayScrollSource = null;
  }

  function getLatestUserMessageElement() {
    const el = getScrollElement();
    if (!el) return null;
    const userMessages = el.querySelectorAll(
      '[data-message-role="user"], article.message--user, .message--user'
    );
    return userMessages.length ? userMessages[userMessages.length - 1] : null;
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
    hydrationRevealTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    hydrationRevealTimerIds = [];
    if (hydrationTimerId) {
      window.clearTimeout(hydrationTimerId);
      hydrationTimerId = 0;
    }
    if (hydrationRafId) {
      window.cancelAnimationFrame(hydrationRafId);
      hydrationRafId = 0;
    }
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

  function applyHydrationBottomScroll() {
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
    recalculateFocusSpacerHeight(options);

    const target = getLatestUserMessageElement();
    if (!applyElementScroll(target, options)) return;

    if (!options.stable) return;

    const delays = options.keyboardOpenOnSubmit
      ? KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS
      : STABLE_SCROLL_DELAYS;

    delays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          recalculateFocusSpacerHeight(options);
          applyElementScroll(target, {...options, behavior: "auto"});
        });
      }, delay);
      stableScrollTimerIds.push(timerId);
    });
  }

  function applyBottomScrollAfterRender() {
    const options = pendingAfterRenderOptions || {};
    clearAfterRenderScrollState();

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        applyBottomScroll(options.behavior || "auto");
      });
    });
  }

  function schedulePostRevealBottomCorrection() {
    const delays = isAndroidHydrationRuntime()
      ? ANDROID_POST_REVEAL_SCROLL_DELAYS
      : POST_REVEAL_SCROLL_DELAYS;

    delays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          if (!userIsAtBottom.value) return;
          updateOverlayScrollbarFrame();
          applyBottomScroll("auto");
        });
      }, delay);
      stableScrollTimerIds.push(timerId);
    });
  }

  function runHydrationRevealScrollSequence(runId) {
    const delays = isAndroidHydrationRuntime()
      ? ANDROID_HYDRATION_REVEAL_SCROLL_DELAYS
      : HYDRATION_REVEAL_SCROLL_DELAYS;
    let completedCount = 0;

    hydrationRevealTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    hydrationRevealTimerIds = [];

    delays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        if (runId !== hydrationRunId) return;
        window.requestAnimationFrame(() => {
          if (runId !== hydrationRunId) return;
          applyHydrationBottomScroll();
          completedCount += 1;

          if (completedCount < delays.length) return;
          hydrationRevealTimerIds = [];
          pendingHydrationAssistantIds = null;
          emit("history-hydrated");
          schedulePostRevealBottomCorrection();
        });
      }, delay);
      hydrationRevealTimerIds.push(timerId);
    });
  }

  function completeInitialHydration(runId) {
    if (runId !== hydrationRunId) return;
    if (hydrationTimerId) {
      window.clearTimeout(hydrationTimerId);
      hydrationTimerId = 0;
    }

    window.requestAnimationFrame(() => {
      if (runId !== hydrationRunId) return;
      applyHydrationBottomScroll();
      runHydrationRevealScrollSequence(runId);
    });
  }

  function scheduleInitialHydrationFallback(runId) {
    if (hydrationTimerId) window.clearTimeout(hydrationTimerId);
    const fallbackDelay = isAndroidHydrationRuntime()
      ? ANDROID_HYDRATION_REVEAL_FALLBACK_MS
      : HYDRATION_REVEAL_FALLBACK_MS;

    hydrationTimerId = window.setTimeout(() => {
      hydrationTimerId = 0;
      completeInitialHydration(runId);
    }, fallbackDelay);
  }

  async function startInitialHydration() {
    if (!props.initialHydrating || typeof window === "undefined") return;

    clearHydrationState();
    const runId = hydrationRunId;
    await nextTick();

    if (runId !== hydrationRunId || !props.initialHydrating) return;

    pendingHydrationAssistantIds = new Set(getAssistantMessageIds());
    if (!pendingHydrationAssistantIds.size) {
      completeInitialHydration(runId);
      return;
    }

    scheduleInitialHydrationFallback(runId);
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

  async function handleMessageRendered(messageId, renderPart = "") {
    emit("content-rendered");

    await nextTick();
    updateOverlayScrollbarFrame();
    recalculateFocusSpacerHeight();

    if (pendingHydrationAssistantIds) {
      const id = String(messageId ?? "");
      const isLayoutReady =
        !renderPart || renderPart === "content" || renderPart === "layout-ready";
      if (isLayoutReady) pendingHydrationAssistantIds.delete(id);
      if (!pendingHydrationAssistantIds.size) {
        const runId = hydrationRunId;
        completeInitialHydration(runId);
      }
      return;
    }

    if (renderPart === "enhanced" && userIsAtBottom.value) {
      window.requestAnimationFrame(() => applyBottomScroll("auto"));
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

  watch(
    () => [props.loading, props.autoScrollOnAnswer, props.messages.length],
    () => {
      updateOverlayScrollbarFrame();
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
    window.addEventListener("resize", recalculateFocusSpacerHeight, {
      passive: true,
    });
    window.visualViewport?.addEventListener(
      "resize",
      recalculateFocusSpacerHeight,
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
    cleanupOverlayScrollbar();
    if (typeof window === "undefined") return;
    window.removeEventListener("resize", recalculateFocusSpacerHeight);
    window.visualViewport?.removeEventListener(
      "resize",
      recalculateFocusSpacerHeight
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
    getIsAtBottom,
    getScrollElement,
  };
}
