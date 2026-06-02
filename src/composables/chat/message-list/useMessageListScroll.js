import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useMessageFocusSpacer} from "./useMessageFocusSpacer";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/utils/overlayScrollbar";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";

const BOTTOM_THRESHOLD = 48;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];
const HYDRATION_REVEAL_SCROLL_DELAYS = [0, 32, 80, 120];
const ANDROID_HYDRATION_REVEAL_SCROLL_DELAYS = [0, 32, 80, 160, 240];
const POST_REVEAL_SCROLL_DELAYS = [80, 180, 320];
const ANDROID_POST_REVEAL_SCROLL_DELAYS = [80, 180, 320, 520];
const HYDRATION_REVEAL_FALLBACK_MS = 180;
const ANDROID_HYDRATION_REVEAL_FALLBACK_MS = 320;
const RESIZE_RECALCULATE_DEBOUNCE_MS = 120;
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
  let hydrationBottomCorrectionUntil = 0;
  let pendingHydrationAssistantIds = null;
  let resizeRecalculateTimerId = 0;
  let resizeRecalculateRafId = 0;
  let hydrationMermaidRafId = 0;
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

  function cleanupOverlayScrollbar() {
    if (overlayScrollViewport && overlayScrollViewport !== overlayScrollSource) {
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
      target = userMessages.length ? userMessages[userMessages.length - 1] : null;
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
    if (hydrationMermaidRafId) {
      window.cancelAnimationFrame(hydrationMermaidRafId);
      hydrationMermaidRafId = 0;
    }
    hydrationResizeObserver?.disconnect();
    hydrationResizeObserver = null;
    pendingHydrationAssistantIds = null;
    hydrationBottomCorrectionUntil = 0;
  }

  function getAssistantMessageIds() {
    return (props.messages || [])
      .filter((message) => message?.role === "assistant")
      .map((message, index) => String(message.id ?? `assistant-${index}`));
  }

  function handleUserScrollIntent() {
    clearStableTimers();
    clearAfterRenderScrollState();
    hydrationBottomCorrectionUntil = 0;
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
          window.requestAnimationFrame(() => {
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
        window.requestAnimationFrame(() => {
          applyLatestUserAnchor({...options, behavior: "auto"});
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

  function scheduleHydrationMermaidEnhancement() {
    if (typeof window === "undefined") return;

    if (hydrationMermaidRafId) {
      window.cancelAnimationFrame(hydrationMermaidRafId);
    }

    hydrationMermaidRafId = window.requestAnimationFrame(() => {
      hydrationMermaidRafId = 0;
      const root = scrollRef.value;
      if (!root) return;

      renderMermaidInElement(root)
        .then(() => {
          updateOverlayScrollbarFrame();
          if (hydrationBottomCorrectionUntil && Date.now() <= hydrationBottomCorrectionUntil) {
            applyBottomScroll("auto");
          }
          emit("content-rendered");
        })
        .catch(() => {});
    });
  }

  function schedulePostRevealBottomCorrection() {
    if (!shouldAutoHydrationBottomScroll()) return;

    const delays = isAndroidHydrationRuntime()
      ? ANDROID_POST_REVEAL_SCROLL_DELAYS
      : POST_REVEAL_SCROLL_DELAYS;

    delays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        window.requestAnimationFrame(() => {
          updateOverlayScrollbarFrame();
          applyBottomScroll("auto");
        });
      }, delay);
      stableScrollTimerIds.push(timerId);
    });
  }

  function runHydrationRevealScrollSequence(runId) {
    hydrationBottomCorrectionUntil = Date.now() + (isAndroidHydrationRuntime() ? 2600 : 1800);
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
          scheduleHydrationMermaidEnhancement();
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

      if (!shouldAutoHydrationBottomScroll()) {
        pendingHydrationAssistantIds = null;
        emit("history-hydrated");
        updateBottomState();
        return;
      }

      applyHydrationBottomScroll();
      runHydrationRevealScrollSequence(runId);
    });
  }

  function scheduleInitialHydrationFallback(runId) {
    if (hydrationTimerId) window.clearTimeout(hydrationTimerId);
    const pendingCount = pendingHydrationAssistantIds?.size || 0;
    const androidRuntime = isAndroidHydrationRuntime();
    const baseDelay = androidRuntime
      ? ANDROID_HYDRATION_REVEAL_FALLBACK_MS
      : HYDRATION_REVEAL_FALLBACK_MS;
    const adaptiveDelay = Math.min(
      androidRuntime ? 2200 : 1600,
      pendingCount * (androidRuntime ? 8 : 6)
    );
    const fallbackDelay = baseDelay + adaptiveDelay;

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

    // 자동 스크롤 OFF + 답변 생성 중에는 질문 직후 계산한 하단 spacer를 유지합니다.
    // chunk/render 이벤트마다 spacer를 다시 계산하면 답변 높이가 커지는 동안 spacer가 줄어들고,
    // 브라우저 scroll anchoring과 맞물려 질문 위치가 위아래로 흔들릴 수 있습니다.
    // loading 종료 watch에서 spacer는 0으로 정리됩니다.
    if (!(props.loading && !props.autoScrollOnAnswer)) {
      recalculateFocusSpacerHeight();
    }

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

    if (hydrationBottomCorrectionUntil && Date.now() <= hydrationBottomCorrectionUntil) {
      window.requestAnimationFrame(() => {
        updateOverlayScrollbarFrame();
        applyBottomScroll("auto");
      });
      return;
    }

    if (
      renderPart === "enhanced" &&
      props.autoScrollOnAnswer &&
      userIsAtBottom.value
    ) {
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
    () => [props.loading, props.autoScrollOnAnswer, props.messages.length],
    ([loading, autoScrollOnAnswer]) => {
      latestUserMessageCache = null;
      latestUserMessageCacheKey = "";
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
    getIsAtBottom,
    getScrollElement,
  };
}
