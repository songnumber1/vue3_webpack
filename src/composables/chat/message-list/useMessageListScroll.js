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

const BOTTOM_THRESHOLD = 48;
const STABLE_SCROLL_DELAYS = [0, 32, 80, 160, 320, 520];
const HISTORY_RENDER_READY_STABLE_FRAMES = 3;
const HISTORY_RENDER_DOM_READY_MAX_FRAMES = 360;
const HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES = 720;
const HISTORY_RENDER_LAYOUT_STABLE_FRAMES = 4;
const HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES = 6;
const RESIZE_RECALCULATE_DEBOUNCE_MS = 120;
const KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS = [
  0, 80, 160, 320, 600, 900, 1300, 1800, 2300,
];

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

  function escapeMessageSelectorValue(value) {
    const stringValue = String(value ?? "");
    if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
      return CSS.escape(stringValue);
    }
    return stringValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function getHistoryRenderMessageElement(message, index) {
    const root = scrollRef.value;
    if (!root?.isConnected) return null;

    const key = getHistoryRenderMessageKey(message, index);
    const escapedKey = escapeMessageSelectorValue(key);
    const exactElement = root.querySelector(
      `[data-message-id="${escapedKey}"]`
    );
    if (exactElement) return exactElement;

    // 데이터 속성 조회가 실패한 경우에만 v-for 순서와 role을 기준으로 폴백합니다.
    const role = String(message?.role || "");
    const roleElements = Array.from(
      root.querySelectorAll(
        `[data-message-role="${escapeMessageSelectorValue(role)}"]`
      )
    );
    const roleIndex =
      (props.messages || [])
        .slice(0, index + 1)
        .filter((item) => String(item?.role || "") === role).length - 1;
    return roleElements[roleIndex] || null;
  }

  function hasRenderedMarkdownElement(element, selector) {
    const target = element?.querySelector?.(selector);
    if (!target) return false;
    return target.childNodes.length > 0 || target.textContent.trim().length > 0;
  }

  function isAssistantErrorMessage(message) {
    return Boolean(
      message?.role !== "user" &&
      (message?.status === "error" || message?.error === true)
    );
  }

  function isHistoryRenderContentReady() {
    const list = props.messages || [];
    for (let index = 0; index < list.length; index += 1) {
      const message = list[index];
      const element = getHistoryRenderMessageElement(message, index);
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

  function isHistoryRenderDomReady() {
    const root = scrollRef.value;
    if (!root?.isConnected) return false;

    const list = props.messages || [];
    if (!props.historyMessagesReady) return false;

    for (let index = 0; index < list.length; index += 1) {
      if (!getHistoryRenderMessageElement(list[index], index)?.isConnected) {
        return false;
      }
    }

    return true;
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

      const ready = isHistoryRenderDomReady() && isHistoryRenderContentReady();
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
    return isHistoryRenderDomReady();
  }

  async function renderHistoryMessagesSequentially(runId) {
    await nextTick();
    if (runId !== historyRenderRunId || !props.historyRendering) return false;

    await waitAnimationFrames(1);
    if (runId !== historyRenderRunId || !props.historyRendering) return false;

    const root = scrollRef.value;
    if (!root?.isConnected) return true;

    const messageEntries = (props.messages || []).map((message, index) => ({
      message,
      index,
      element: getHistoryRenderMessageElement(message, index),
    }));

    for (const {message, element} of messageEntries) {
      if (runId !== historyRenderRunId || !props.historyRendering) return false;
      if (!element?.isConnected) continue;

      // v-for로 만들어진 실제 메시지 DOM 순서대로 한 개씩 후처리합니다.
      // 전역 queue/Set 누적 상태를 쓰지 않고, 현재 메시지에서 성공하면 SVG,
      // 실패하면 해당 메시지만 원본 코드 fallback으로 확정합니다.
      if (message?.role === "assistant") {
        try {
          await renderMermaidInElement(element, {
            loadWaitMode: "animation-frame",
            loadMaxFrames: isAndroidHistoryRenderRuntime()
              ? HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES
              : HISTORY_RENDER_DOM_READY_MAX_FRAMES,
          });
        } catch {
          // Mermaid CDN/network/문법 오류가 발생해도 이력 대화방 historyRender은
          // 해당 메시지를 코드 fallback으로 확정하고 다음 메시지로 진행합니다.
        } finally {
          fallbackPendingMermaidToCode(element);
        }
      }

      updateOverlayScrollbarFrame();
      await nextTick();
      await waitAnimationFrames(1);
    }

    fallbackPendingMermaidToCode(root);
    updateOverlayScrollbarFrame();
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
    return Boolean(
      root.querySelector('.md-mermaid[data-mermaid-pending="true"]')
    );
  }

  async function waitForHistoryRenderLayoutStability(runId) {
    const requiredStableFrames = isAndroidHistoryRenderRuntime()
      ? HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES
      : HISTORY_RENDER_LAYOUT_STABLE_FRAMES;
    let previousMetrics = "";
    let stableFrames = 0;

    while (runId === historyRenderRunId && props.historyRendering) {
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

    return false;
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

      await renderHistoryMessagesSequentially(runId);
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
