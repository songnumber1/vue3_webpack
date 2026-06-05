import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useMessageFocusSpacer} from "./useMessageFocusSpacer";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/utils/overlayScrollbar";
import {
  fallbackPendingMermaidToCode,
  renderMermaidInElement,
} from "@/utils/mermaidRenderer";
import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";

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
// Android Chrome/WebView native scrolling keeps momentum after a fast fling.
// Auto prepend during native scrolling is unstable, so Android uses a manual
// "load previous history" button. PC keeps the existing automatic threshold path.

function isAndroidHistoryRenderRuntime() {
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

function isForcedAndroidPlatformOverride() {
  const override = getRuntimeSystemSettings().platformOverride;
  return (
    override === PLATFORM_OVERRIDE_MODES.androidChrome ||
    override === PLATFORM_OVERRIDE_MODES.androidWebView
  );
}

function isCompactHistoryViewport() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }

  if (document.body?.classList?.contains("mobile-mode")) return true;

  const settings = getRuntimeSystemSettings();
  const breakpoint = Number(settings.mobileBreakpoint);
  const limit =
    Number.isFinite(breakpoint) && breakpoint > 0 ? breakpoint : 768;
  const width = Math.min(
    window.visualViewport?.width || Number.POSITIVE_INFINITY,
    window.innerWidth || Number.POSITIVE_INFINITY,
    document.documentElement?.clientWidth || Number.POSITIVE_INFINITY
  );

  return Number.isFinite(width) && width > 0 && width <= limit;
}

function shouldUseManualHistoryLoadMode() {
  if (isAndroidHistoryRenderRuntime()) return true;

  // PC 브라우저에서 Android 플랫폼을 강제 설정한 경우에는 실제 Android 런타임이 아니므로
  // 데스크톱 폭에서는 PC 자동 lazy load를 유지합니다. 단, 모바일 사이즈로 줄여
  // Android 모바일 UX를 검증할 때는 명시적 버튼 방식을 사용합니다.
  return isForcedAndroidPlatformOverride() && isCompactHistoryViewport();
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
  let afterRenderScrollRafId = 0;
  let pendingAfterRenderAssistantIds = null;
  let pendingAfterRenderOptions = null;
  let historyRenderRunId = 0;
  let historyRenderCompleting = false;
  let resizeRecalculateTimerId = 0;
  let resizeRecalculateRafId = 0;
  let trackedRafIds = [];
  let renderedFrameRafId = 0;
  let renderedFrameNeedsSpacer = false;
  let renderedFrameNeedsBottomState = false;
  let latestUserMessageCache = null;
  let latestUserMessageCacheKey = "";
  const previousHistoryLoadInProgress = ref(false);
  const androidManualHistoryLoadMode = ref(false);
  let historyLazyScrollRestoreUntil = 0;
  let manualHistoryAnchorLockCleanup = null;
  let manualHistoryAnchorLockToken = 0;

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

  function refreshManualHistoryLoadMode() {
    androidManualHistoryLoadMode.value = shouldUseManualHistoryLoadMode();
  }

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

  function findMessageElementById(container, messageId) {
    if (!container || !messageId) return null;

    const targetId = String(messageId);
    const nodes = container.querySelectorAll?.("[data-message-id]") || [];
    for (const node of nodes) {
      if (node?.getAttribute?.("data-message-id") === targetId) {
        return node;
      }
    }
    return null;
  }

  function getElementOffsetTopWithinScroll(element, container) {
    if (!element || !container) return 0;

    let top = 0;
    let current = element;
    while (current && current !== container) {
      top += Number(current.offsetTop || 0);
      current = current.offsetParent;
    }

    if (current === container) return top;

    const containerRect = container.getBoundingClientRect?.();
    const elementRect = element.getBoundingClientRect?.();
    if (!containerRect || !elementRect) return 0;
    return container.scrollTop + elementRect.top - containerRect.top;
  }

  function getHistoryLazyViewportAnchor(el) {
    if (!el?.querySelectorAll || !el.getBoundingClientRect) return null;

    const containerRect = el.getBoundingClientRect();
    const anchorTopLimit = containerRect.top + 12;
    const anchorBottomLimit = containerRect.bottom - 12;
    const candidates = Array.from(el.querySelectorAll("[data-message-id]"));

    let fallback = null;
    for (const node of candidates) {
      if (!node?.getBoundingClientRect) continue;
      const rect = node.getBoundingClientRect();
      if (rect.bottom <= anchorTopLimit || rect.top >= anchorBottomLimit) {
        continue;
      }

      const id = node.getAttribute("data-message-id");
      if (!id) continue;

      const snapshot = {
        id,
        scrollTop: el.scrollTop,
        offsetTop: getElementOffsetTopWithinScroll(node, el),
        viewportTop: rect.top - containerRect.top,
      };

      // 화면 맨 위에 반쯤 걸친 요소보다 화면 안쪽에 안정적으로 보이는 요소를 우선합니다.
      if (rect.top >= anchorTopLimit) {
        return snapshot;
      }
      if (!fallback) fallback = snapshot;
    }

    return fallback;
  }

  function restoreHistoryLazyViewportAnchor(el, anchor) {
    if (!el || !anchor?.id) return false;

    const target = findMessageElementById(el, anchor.id);
    if (!target) return false;

    const currentOffsetTop = getElementOffsetTopWithinScroll(target, el);
    const delta = currentOffsetTop - Number(anchor.offsetTop || 0);
    const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const nextScrollTop = Math.min(
      maxScrollTop,
      Math.max(0, Number(anchor.scrollTop || 0) + delta)
    );

    if (Math.abs(el.scrollTop - nextScrollTop) >= 1) {
      suppressHistoryLazyScrollRestore();
      el.scrollTop = nextScrollTop;
    }
    return true;
  }

  function restoreHistoryLazyViewportAnchorByViewport(el, anchor) {
    if (!el || !anchor?.id || !el.getBoundingClientRect) return false;

    const target = findMessageElementById(el, anchor.id);
    if (!target?.getBoundingClientRect) return false;

    const containerRect = el.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentViewportTop = targetRect.top - containerRect.top;
    const expectedViewportTop = Number.isFinite(anchor.viewportTop)
      ? Number(anchor.viewportTop)
      : 0;
    const delta = currentViewportTop - expectedViewportTop;

    if (Math.abs(delta) < 0.5) return true;

    const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    const nextScrollTop = Math.min(
      maxScrollTop,
      Math.max(0, el.scrollTop + delta)
    );

    if (Math.abs(el.scrollTop - nextScrollTop) >= 0.5) {
      suppressHistoryLazyScrollRestore();
      el.scrollTop = nextScrollTop;
    }
    return true;
  }

  function cancelManualHistoryAnchorLock() {
    manualHistoryAnchorLockToken += 1;
    if (typeof manualHistoryAnchorLockCleanup === "function") {
      manualHistoryAnchorLockCleanup();
    }
    manualHistoryAnchorLockCleanup = null;
  }

  function collectElementsBeforeAnchor(el, anchorId) {
    if (!el?.querySelectorAll || !anchorId) return [];

    const nodes = Array.from(el.querySelectorAll("[data-message-id]"));
    const result = [];
    for (const node of nodes) {
      const id = node?.getAttribute?.("data-message-id");
      if (id === anchorId) break;
      if (node?.nodeType === 1) result.push(node);
    }
    return result;
  }

  function startManualHistoryAnchorLock(el, anchor, duration = 2200) {
    if (!el || !anchor?.id || typeof window === "undefined") return false;

    cancelManualHistoryAnchorLock();
    const token = manualHistoryAnchorLockToken;
    let target = findMessageElementById(el, anchor.id);
    if (!target) return false;

    let finished = false;
    let rafId = 0;
    const timerIds = [];
    let resizeObserver = null;
    let mutationObserver = null;
    let observedNodes = [];

    el.classList?.add?.("message-list--history-prepend-locking");

    const cleanup = () => {
      if (finished) return;
      finished = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      timerIds.forEach((timerId) => window.clearTimeout(timerId));
      resizeObserver?.disconnect?.();
      mutationObserver?.disconnect?.();
      observedNodes = [];
      el.classList?.remove?.("message-list--history-prepend-locking");
      if (manualHistoryAnchorLockCleanup === cleanup) {
        manualHistoryAnchorLockCleanup = null;
      }
    };

    const scheduleAdjust = () => {
      if (finished || rafId || token !== manualHistoryAnchorLockToken) return;
      rafId = window.requestAnimationFrame(adjust);
    };

    const observePrependNodes = () => {
      if (typeof ResizeObserver === "undefined") return;
      target = findMessageElementById(el, anchor.id);
      if (!target) return;

      const nextNodes = collectElementsBeforeAnchor(el, anchor.id);
      if (
        nextNodes.length === observedNodes.length &&
        nextNodes.every((node, index) => node === observedNodes[index])
      ) {
        return;
      }

      observedNodes = nextNodes;
      resizeObserver?.disconnect?.();
      resizeObserver = new ResizeObserver(scheduleAdjust);
      observedNodes.forEach((node) => resizeObserver.observe(node));
      resizeObserver.observe(target);
    };

    function adjust() {
      rafId = 0;
      if (finished || token !== manualHistoryAnchorLockToken) {
        cleanup();
        return;
      }
      target = findMessageElementById(el, anchor.id);
      if (!target) {
        cleanup();
        return;
      }
      restoreHistoryLazyViewportAnchorByViewport(el, anchor);
      observePrependNodes();
      updateOverlayScrollbarFrame();
      updateBottomState();
    }

    manualHistoryAnchorLockCleanup = cleanup;
    observePrependNodes();

    if (typeof MutationObserver !== "undefined") {
      mutationObserver = new MutationObserver(scheduleAdjust);
      mutationObserver.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    scheduleAdjust();
    [
      0, 16, 32, 64, 96, 160, 240, 360, 520, 760, 1040, 1400, 1800, 2200,
    ].forEach((delay) => {
      timerIds.push(window.setTimeout(scheduleAdjust, delay));
    });

    timerIds.push(window.setTimeout(cleanup, duration));
    return true;
  }

  function clearStableTimers() {
    stableScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
    stableScrollTimerIds = [];
    clearTrackedAnimationFrames();
  }

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

  function clearHistoryRenderState() {
    historyRenderRunId += 1;
    clearTrackedAnimationFrames();
    historyRenderCompleting = false;
  }

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

  function getHistoryRenderMessageKey(message, index) {
    return String(message?.id ?? `${message?.role || "message"}-${index}`);
  }

  function getAssistantMessageIds() {
    return (props.messages || [])
      .map((message, index) => ({message, index}))
      .filter(({message}) => message?.role === "assistant")
      .map(({message, index}) => getHistoryRenderMessageKey(message, index));
  }

  function handleUserScrollIntent() {
    cancelManualHistoryAnchorLock();
    clearStableTimers();
    clearAfterRenderScrollState();
    if (!props.historyRendering) {
      clearHistoryRenderState();
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

  function shouldAutoHistoryRenderBottomScroll() {
    // 대화방 이력 진입 시에는 답변 자동 스크롤 설정과 무관하게 항상 마지막 메시지로 이동합니다.
    // autoScrollOnAnswer는 실시간 답변 추적 옵션이고, history render의 시작 위치 정책과 분리되어야 합니다.
    return props.historyRendering === true;
  }

  function applyHistoryRenderBottomScroll() {
    if (!shouldAutoHistoryRenderBottomScroll()) return;

    const el = getScrollElement();
    if (!el) return;

    // 채팅방 입장 중에는 bottomRef.scrollIntoView()를 사용하지 않습니다.
    // Android Chrome/WebView에서 scrollIntoView가 외부 page scroll까지 건드리면
    // hidden 상태에서도 화면이 내려가는 움직임이 보일 수 있으므로, 내부 scrollTop만 확정합니다.
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight);
    userIsAtBottom.value = true;
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

    if (props.historyRendering) return;

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

  function countMermaidBlocksInText(value = "") {
    const matches = String(value || "").match(/```\s*mermaid/gi);
    return matches ? matches.length : 0;
  }

  function getExpectedHistoryRenderMermaidCount() {
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

  function isAssistantErrorMessage(message) {
    return Boolean(
      message?.role !== "user" &&
      (message?.status === "error" || message?.error === true)
    );
  }

  function isHistoryRenderContentReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    const {messages} = domIndex;
    for (let index = 0; index < messages.length; index += 1) {
      const message = messages[index];
      const element = getHistoryRenderMessageElementFromIndex(
        domIndex,
        message,
        index
      );
      if (!element?.isConnected) return false;

      if (message?.role !== "assistant" || isAssistantErrorMessage(message)) {
        continue;
      }

      if (message?.reasoningContent) {
        if (
          !hasRenderedMarkdownElement(
            element,
            ".reasoning-content.markdown-body"
          )
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
    }
    return true;
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

  function getPendingHistoryRenderMermaidTargets(root = scrollRef.value) {
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

  async function waitForHistoryRenderDomReady(runId) {
    const maxFrames = isAndroidHistoryRenderRuntime()
      ? HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES
      : HISTORY_RENDER_DOM_READY_MAX_FRAMES;
    let stableFrames = 0;

    for (let frame = 0; frame < maxFrames; frame += 1) {
      if (runId !== historyRenderRunId || !props.historyRendering) return false;

      await nextTick();
      updateOverlayScrollbarFrame();

      const domIndex = createHistoryRenderDomIndex();
      const ready =
        isHistoryRenderDomReady(domIndex) &&
        isHistoryRenderContentReady(domIndex) &&
        isHistoryRenderMermaidDomReady(domIndex.root);
      if (ready) {
        stableFrames += 1;
        if (stableFrames >= HISTORY_RENDER_READY_STABLE_FRAMES) return true;
      } else {
        stableFrames = 0;
      }

      await waitAnimationFrames(1);
    }

    // 비정상 메시지/마크다운 이벤트 누락이 있어도 progress가 고착되지 않도록
    // 현재 DOM 기준으로 가능한 후처리만 수행하고 finally에서 화면을 해제합니다.
    const fallbackIndex = createHistoryRenderDomIndex();
    return (
      isHistoryRenderDomReady(fallbackIndex) &&
      isHistoryRenderMermaidDomReady(fallbackIndex.root)
    );
  }

  async function renderHistoryRoomPendingMermaidSequentially(runId) {
    await nextTick();
    if (runId !== historyRenderRunId || !props.historyRendering) return false;

    await waitAnimationFrames(1);
    if (runId !== historyRenderRunId || !props.historyRendering) return false;

    const root = scrollRef.value;
    if (!root?.isConnected) return true;

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

  async function runHistoryRenderThenScrollSequence(runId) {
    try {
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      await nextTick();
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      setupOverlayScrollbar();
      updateOverlayScrollbarFrame();

      await waitForHistoryRenderDomReady(runId);
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      await renderHistoryRoomPendingMermaidSequentially(runId);
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      recalculateFocusSpacerHeight();
      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();

      await waitForHistoryRenderLayoutStability(runId);
      if (runId !== historyRenderRunId || !props.historyRendering) return;

      updateOverlayScrollbarFrame();
      applyHistoryRenderBottomScroll();
      await nextTick();
      await waitAnimationFrames(2);
      applyHistoryRenderBottomScroll();
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

    if (props.historyRendering) {
      clearStableTimers();
      applyHistoryRenderBottomScroll();
      return;
    }

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

    // 대화방 입장 history render 중에는 고정 시간 debounce를 사용하지 않습니다.
    // 화면은 hidden 상태에서 렌더/mermaid/scroll 안정화 루프가 순차 진행하므로,
    // resize observer가 끼어들어도 다음 paint에서 한 번만 보정합니다.
    clearResizeRecalculateScheduler();
    if (props.historyRendering) {
      resizeRecalculateRafId = window.requestAnimationFrame(() => {
        resizeRecalculateRafId = 0;
        refreshManualHistoryLoadMode();
        recalculateFocusSpacerHeight();
        updateOverlayScrollbarFrame();
        updateBottomState();
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
        refreshManualHistoryLoadMode();
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
      props.historyRendering,
      props.historyMessagesReady,
    ],
    ([loading, autoScrollOnAnswer, , historyRendering]) => {
      latestUserMessageCache = null;
      latestUserMessageCacheKey = "";

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
    window.addEventListener("touchstart", handleUserScrollIntent, {
      passive: true,
    });
    window.addEventListener("wheel", handleUserScrollIntent, {passive: true});
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
    window.removeEventListener("touchstart", handleUserScrollIntent);
    window.removeEventListener("wheel", handleUserScrollIntent);
  });

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
    scrollToLatestUserMessage,
    getIsAtBottom,
    getScrollElement,
  };
}
