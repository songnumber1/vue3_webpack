<template>
  <div v-show="visible" class="message-list-shell">
    <section
      ref="scrollRef"
      class="message-list"
      :class="{
        'message-list--history-rendering':
          historyRendering && !historyMarkdownVisible,
        'message-list--manual-stream': loading,
      }"
      :inert="historyRendering && !historyMarkdownVisible ? '' : null"
      aria-live="polite"
      :aria-busy="historyRendering ? 'true' : 'false'"
      @scroll.passive="handleScroll"
      @touchstart.passive="handleUserScrollIntent"
      @wheel.passive="handleUserScrollIntent"
      @pointerdown.passive="handleUserScrollIntent"
    >
      <ChatMessageRouter
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :show-regenerate="!readonly && isLastAssistantMessage(message)"
        :defer-mermaid-enhancement="historyRendering"
      />
      <div v-if="loading" class="typing-row">
        <span></span><span></span><span></span>
      </div>
      <div
        v-if="streamFocusSpacerHeight > 0"
        class="stream-focus-spacer"
        :style="{height: `${streamFocusSpacerHeight}px`}"
        aria-hidden="true"
      ></div>
      <div ref="bottomRef" class="message-list-anchor" aria-hidden="true"></div>
    </section>
  </div>
</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import ChatMessageRouter from "./ChatMessageRouter.vue";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {
  destroyOverlayScrollbar,
  getOverlayScrollbarViewport,
  initOverlayScrollbar,
  updateOverlayScrollbar,
} from "@/platform/scroll/overlayScrollbarController";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {
  fallbackPendingMermaidToCode,
  renderMermaidInElement,
} from "@/utils/mermaidRenderer";
import {waitAnimationFrames} from "@/utils/frameScheduler";
import {
  findMessageElementById,
  getElementOffsetTopWithinScroll,
} from "@/composables/chat/internal/message-list/messageListDomUtils";
import {
  applyWindowFallbackScroll,
  countMermaidBlocksInText,
  getScrollableAncestors,
  isAndroidHistoryRenderRuntime,
  isAssistantErrorMessage,
  scrollElementToTarget,
} from "@/composables/chat/internal/message-list/messageListScrollUtils";
import {
  BOTTOM_THRESHOLD,
  HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES,
  HISTORY_RENDER_ANDROID_LAYOUT_MAX_FRAMES,
  HISTORY_RENDER_ANDROID_LAYOUT_STABLE_FRAMES,
  HISTORY_RENDER_DOM_READY_MAX_FRAMES,
  HISTORY_RENDER_LAYOUT_MAX_FRAMES,
  HISTORY_RENDER_LAYOUT_STABLE_FRAMES,
  HISTORY_RENDER_MERMAID_BATCH_SIZE,
  HISTORY_RENDER_READY_STABLE_FRAMES,
  KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS,
  RESIZE_RECALCULATE_DEBOUNCE_MS,
  STABLE_SCROLL_DELAYS,
} from "@/composables/chat/internal/message-list/messageListScrollConstants";
import {
  provideMessageActions,
  useMessageActions,
} from "@/composables/chat/context/messageActionContext";
import {useChatQuestionAnswerView} from "@/composables/chat/useChatQuestionAnswer";

const props = defineProps({
  visible: {type: Boolean, default: true},
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
  historyRendering: {type: Boolean, default: false},
  historyMarkdownVisible: {type: Boolean, default: false},
  historyMessagesReady: {type: Boolean, default: false},
  historyRenderKey: {type: [String, Number], default: ""},
  messageRenderPolicy: {type: Object, default: null},
  readonly: {type: Boolean, default: false},
});

const parentMessageActions = useMessageActions();

function isLastAssistantMessage(message) {
  if (!message || message.role !== "assistant") {
    return false;
  }

  for (let index = props.messages.length - 1; index >= 0; index -= 1) {
    const candidate = props.messages[index];
    if (candidate?.role === "assistant") {
      return candidate === message || candidate?.id === message.id;
    }
  }

  return false;
}

function isMermaidRenderingEnabled() {
  return isMermaidRenderingEnabledForPlatform();
}

const scrollRef = ref(null);
const bottomRef = ref(null);
const userIsAtBottom = ref(true);
let stableScrollTimerIds = [];
let historyRenderRunId = 0;
let historyRenderCompleting = false;
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();

// -------------------------------------------------------------------------
// OverlayScrollbar lifecycle and rendered-frame scheduling
// -------------------------------------------------------------------------
let overlayScrollViewport = null;
let overlayScrollSource = null;
let trackedRafIds = [];
let renderedFrameRafId = 0;
let renderedFrameNeedsSpacer = false;
let renderedFrameNeedsBottomState = false;

function getScrollElement() {
  return overlayScrollViewport || scrollRef.value;
}

function cleanupOverlayScrollbar() {
  if (overlayScrollViewport && overlayScrollViewport !== overlayScrollSource) {
    overlayScrollViewport.removeEventListener("scroll", handleScroll);
  }
  if (overlayScrollSource) destroyOverlayScrollbar(overlayScrollSource);
  overlayScrollViewport = null;
  overlayScrollSource = null;
}

function setupOverlayScrollbar() {
  if (!shouldUseOverlayScrollbar.value) {
    cleanupOverlayScrollbar();
    return;
  }

  const element = scrollRef.value;
  if (!element || overlayScrollSource === element) return;

  cleanupOverlayScrollbar();
  overlayScrollSource = element;
  const instance = initOverlayScrollbar(
    element,
    {
      overflow: {x: "hidden", y: "scroll"},
    },
    {enabled: () => shouldUseOverlayScrollbar.value}
  );

  if (!instance) {
    overlayScrollSource = null;
    overlayScrollViewport = null;
    return;
  }

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
  parentMessageActions.messageContentRendered?.();

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

// -------------------------------------------------------------------------
// Latest user-message lookup and focus spacer integration
// -------------------------------------------------------------------------
let latestUserMessageCache = null;
let latestUserMessageCacheKey = "";

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

function resetLatestUserMessageCache() {
  latestUserMessageCache = null;
  latestUserMessageCacheKey = "";
}

const streamFocusSpacerHeight = ref(0);

function recalculateFocusSpacerHeight(options = {}) {
  if (!props.loading) {
    streamFocusSpacerHeight.value = 0;
    return;
  }

  const el = getScrollElement();
  const target = getLatestUserMessageElement();
  if (!el || !target) {
    streamFocusSpacerHeight.value = 0;
    return;
  }

  const offset = Number.isFinite(options.offset) ? options.offset : 16;
  const currentSpacer = streamFocusSpacerHeight.value || 0;
  const naturalScrollHeight = Math.max(0, el.scrollHeight - currentSpacer);
  const targetTop = getElementOffsetTopWithinScroll(target, el);
  const requiredSpacer = Math.ceil(
    targetTop - offset + el.clientHeight - naturalScrollHeight
  );
  const maxUsefulSpacer = Math.max(0, el.clientHeight - offset);

  streamFocusSpacerHeight.value = Math.max(
    0,
    Math.min(requiredSpacer, maxUsefulSpacer)
  );
}

async function refreshFocusSpacerAfterRender(options = {}) {
  await nextTick();
  recalculateFocusSpacerHeight(options);
}

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

function getSafeScrollTop(container, top) {
  if (!container) return 0;
  const maxScrollTop = Math.max(
    0,
    container.scrollHeight - container.clientHeight
  );
  const numeric = Number(top);
  return Math.min(
    maxScrollTop,
    Math.max(0, Number.isFinite(numeric) ? numeric : 0)
  );
}

function scrollMessageListToBottom({behavior = "auto"} = {}) {
  const el = getScrollElement();
  if (!el) return false;

  const bottom = bottomRef.value;
  if (bottom?.scrollIntoView) {
    bottom.scrollIntoView({block: "end", inline: "nearest", behavior});
  }

  el.scrollTop = getSafeScrollTop(el, el.scrollHeight - el.clientHeight);
  updateBottomState();
  return true;
}

function scrollToTop({behavior = "auto"} = {}) {
  const el = getScrollElement();
  if (!el) return false;

  if (typeof el.scrollTo === "function") {
    el.scrollTo({top: 0, behavior});
  } else {
    el.scrollTop = 0;
  }
  updateBottomState();
  return true;
}

function scrollToMessage(
  messageId,
  {behavior = "auto", block = "center"} = {}
) {
  const el = getScrollElement();
  if (!el) return false;

  const target = findMessageElementById(scrollRef.value || el, messageId);
  if (!target) return false;

  const targetTop = getElementOffsetTopWithinScroll(target, el);
  const nextTop =
    block === "center"
      ? targetTop - el.clientHeight / 2 + target.offsetHeight / 2
      : targetTop - 16;
  const safeTop = getSafeScrollTop(el, nextTop);

  if (typeof el.scrollTo === "function") {
    el.scrollTo({top: safeTop, behavior});
  } else {
    el.scrollTop = safeTop;
  }
  updateBottomState();
  return true;
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
  if (props.loading) {
    scheduleStableScrolls(
      options.initialOnly ? [0, 32, 80] : [0, 32, 80, 160],
      () => applyLatestUserAnchor({...options, behavior: "auto"})
    );
    return;
  }

  if (!options.stable) return;

  scheduleStableScrolls(
    options.keyboardOpenOnSubmit
      ? KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS
      : STABLE_SCROLL_DELAYS,
    () => applyLatestUserAnchor({...options, behavior: "auto"})
  );
}

// -------------------------------------------------------------------------
// User scroll handling
// -------------------------------------------------------------------------
function handleScroll() {
  updateBottomState();
}

// -------------------------------------------------------------------------
// Scheduler cleanup and history render reset helpers
// -------------------------------------------------------------------------
function clearStableTimers() {
  stableScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  stableScrollTimerIds = [];
  clearTrackedAnimationFrames();
}

function scheduleStableScrolls(delays = [], callback = () => {}) {
  if (typeof window === "undefined") return;

  delays.forEach((delay) => {
    const timerId = window.setTimeout(() => {
      scheduleTrackedAnimationFrame(callback);
    }, delay);
    stableScrollTimerIds.push(timerId);
  });
}

function clearHistoryRenderState() {
  historyRenderRunId += 1;
  clearStableTimers();
  clearAfterRenderScrollState();
  clearRenderedFrameScheduler();
  historyRenderCompleting = false;
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
    if (!hasRenderedMarkdownElement(element, ".bubble-content.markdown-body")) {
      return false;
    }
  }

  return true;
}

function isHistoryRenderContentReady(domIndex = createHistoryRenderDomIndex()) {
  const {messages} = domIndex;
  for (let index = 0; index < messages.length; index += 1) {
    if (!isHistoryRenderMessageMarkdownReady(domIndex, index)) {
      return false;
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
      !getHistoryRenderMessageElementFromIndex(domIndex, messages[index], index)
        ?.isConnected
    ) {
      return false;
    }
  }

  return true;
}

function isHistoryRenderPostProcessReady(
  domIndex = createHistoryRenderDomIndex()
) {
  return (
    isHistoryRenderDomReady(domIndex) &&
    isHistoryRenderContentReady(domIndex) &&
    isHistoryRenderMermaidDomReady(domIndex.root)
  );
}

function getPendingHistoryRenderMermaidTargets(root = scrollRef.value) {
  if (!isMermaidRenderingEnabled()) return [];
  if (!root?.isConnected) return [];
  return Array.from(
    root.querySelectorAll('.md-mermaid[data-mermaid-pending="true"]')
  ).filter((target) => target.isConnected);
}

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
  if (scrollMessageListToBottom({behavior})) {
    userIsAtBottom.value = true;
  }
}

function applyHistoryRenderScrollTarget() {
  // 대화방 이력 진입 중에는 MessageList가 숨겨진 상태에서
  // 공유방/검색/일반방 정책에 맞는 초기 스크롤 위치를 계속 보정합니다.
  if (props.historyRendering !== true) return false;

  const target = props.messageRenderPolicy?.scrollTarget || {type: "bottom"};
  const behavior = target?.behavior || "auto";

  if (target?.type === "message") {
    const applied = scrollToMessage(target.messageId, {
      behavior,
      block: target.block || "center",
    });
    updateBottomState();
    return applied;
  }

  if (target?.type === "first") {
    return scrollToTop({behavior});
  }

  const applied = scrollMessageListToBottom({behavior});
  userIsAtBottom.value = true;
  return applied;
}

function syncHistoryRenderScrollFrame() {
  updateOverlayScrollbarFrame();
  return applyHistoryRenderScrollTarget();
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
    applyHistoryRenderScrollTarget();
    return;
  }

  if (!force && !userIsAtBottom.value) return;

  clearStableTimers();
  applyBottomScroll(behavior);

  if (!stable) return;

  scheduleStableScrolls(STABLE_SCROLL_DELAYS, () => applyBottomScroll("auto"));
}

function handlePendingAfterRenderMessageRendered(messageId) {
  if (!pendingAfterRenderAssistantIds) return;

  pendingAfterRenderAssistantIds.delete(String(messageId ?? ""));
  if (!pendingAfterRenderAssistantIds.size) {
    applyBottomScrollAfterRender();
  }
}

function getIsAtBottom() {
  updateBottomState();
  return userIsAtBottom.value;
}

// -------------------------------------------------------------------------
// History render post-processing and lifecycle sequence
// -------------------------------------------------------------------------
function isCurrentHistoryRenderRun(runId) {
  return runId === historyRenderRunId && props.historyRendering;
}

async function updateHistoryRenderFrameAfterBatch(processedCount = 0) {
  if (processedCount % HISTORY_RENDER_MERMAID_BATCH_SIZE !== 0) return;
  syncHistoryRenderScrollFrame();
  await nextTick();
  await waitAnimationFrames(1);
}

async function renderHistoryRoomPendingMermaidSequentially(runId) {
  await nextTick();
  if (!isCurrentHistoryRenderRun(runId)) return false;

  await waitAnimationFrames(1);
  if (!isCurrentHistoryRenderRun(runId)) return false;

  const root = scrollRef.value;
  if (!root?.isConnected) return true;

  if (!isMermaidRenderingEnabled()) {
    fallbackPendingMermaidToCode(root);
    syncHistoryRenderScrollFrame();
    return true;
  }

  const targets = getPendingHistoryRenderMermaidTargets(root);
  if (!targets.length) {
    syncHistoryRenderScrollFrame();
    return true;
  }

  try {
    await renderMermaidInElement(root, {
      renderRetryCount: isAndroidHistoryRenderRuntime() ? 3 : 1,
      renderRetryFrameGap: isAndroidHistoryRenderRuntime() ? 2 : 1,
      shouldContinue: () => isCurrentHistoryRenderRun(runId),
      onTargetComplete: async (_target, processedCount) => {
        if (!isCurrentHistoryRenderRun(runId)) return;
        await updateHistoryRenderFrameAfterBatch(processedCount);
      },
    });
  } catch {
    // Mermaid 렌더링/문법 오류가 발생해도 history render는 계속 진행합니다.
  } finally {
    if (isCurrentHistoryRenderRun(runId)) {
      fallbackPendingMermaidToCode(root);
    }
  }

  if (!isCurrentHistoryRenderRun(runId)) return false;

  syncHistoryRenderScrollFrame();
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
    if (!isCurrentHistoryRenderRun(runId)) return false;

    await waitAnimationFrames(1);
    if (!isCurrentHistoryRenderRun(runId)) return false;

    syncHistoryRenderScrollFrame();
    await nextTick();
    if (!isCurrentHistoryRenderRun(runId)) return false;

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

  syncHistoryRenderScrollFrame();
  return true;
}

function finalizeHistoryRenderPostProcess() {
  const root = scrollRef.value;
  fallbackPendingMermaidToCode(root);
  syncHistoryRenderScrollFrame();
}

async function waitForHistoryRenderDomReady(runId) {
  const maxFrames = isAndroidHistoryRenderRuntime()
    ? HISTORY_RENDER_ANDROID_DOM_READY_MAX_FRAMES
    : HISTORY_RENDER_DOM_READY_MAX_FRAMES;
  let stableFrames = 0;

  for (let frame = 0; frame < maxFrames; frame += 1) {
    if (!isCurrentHistoryRenderRun(runId)) return false;

    await nextTick();
    updateOverlayScrollbarFrame();

    if (isHistoryRenderPostProcessReady(createHistoryRenderDomIndex())) {
      stableFrames += 1;
      if (stableFrames >= HISTORY_RENDER_READY_STABLE_FRAMES) return true;
    } else {
      stableFrames = 0;
    }

    await waitAnimationFrames(1);
  }

  return isHistoryRenderPostProcessReady(createHistoryRenderDomIndex());
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

    await renderHistoryRoomPendingMermaidSequentially(runId);
    if (!isCurrentHistoryRenderRun(runId)) return;

    recalculateFocusSpacerHeight();
    syncHistoryRenderScrollFrame();

    await waitForHistoryRenderLayoutStability(runId);
    if (!isCurrentHistoryRenderRun(runId)) return;

    syncHistoryRenderScrollFrame();
    await nextTick();
    await waitAnimationFrames(2);
    applyHistoryRenderScrollTarget();
    updateBottomState();
  } finally {
    historyRenderCompleting = false;
    if (isCurrentHistoryRenderRun(runId)) {
      finalizeHistoryRenderPostProcess();
      parentMessageActions.historyRendered?.();
    }
  }
}

function handleUserScrollIntent() {
  clearStableTimers();
  clearAfterRenderScrollState();
  if (!props.historyRendering) {
    clearHistoryRenderState();
  }
}

function addUserScrollIntentListeners(targetWindow = window) {
  if (!targetWindow) return;
  targetWindow.addEventListener("touchstart", handleUserScrollIntent, {
    passive: true,
  });
  targetWindow.addEventListener("wheel", handleUserScrollIntent, {
    passive: true,
  });
  targetWindow.addEventListener("keydown", handleUserScrollIntent);
}

function removeUserScrollIntentListeners(targetWindow = window) {
  if (!targetWindow) return;
  targetWindow.removeEventListener("touchstart", handleUserScrollIntent);
  targetWindow.removeEventListener("wheel", handleUserScrollIntent);
  targetWindow.removeEventListener("keydown", handleUserScrollIntent);
}

// -------------------------------------------------------------------------
// Resize recalculation scheduling controller
// -------------------------------------------------------------------------
let resizeRecalculateTimerId = 0;
let resizeRecalculateRafId = 0;

function runResizeRecalculateFrame() {
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
  if (props.historyRendering) {
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
  }, RESIZE_RECALCULATE_DEBOUNCE_MS);
}

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
function handleMessageRendered(payload) {
  const messageId = payload?.messageId ?? payload;

  if (props.historyRendering) {
    // 채팅방 입장 중에는 메시지별 rendered 이벤트를 누적 상태로 관리하지 않습니다.
    // API 완료 플래그가 켜진 뒤 startHistoryRoomRender()의 단일 try/finally 루프가
    // 현재 v-for DOM 전체를 순차 처리합니다.
    if (props.historyMessagesReady) startHistoryRoomRender();
    return;
  }

  scheduleRenderedFrameUpdate({spacer: !props.loading});

  handlePendingAfterRenderMessageRendered(messageId);
}

provideMessageActions({
  ...parentMessageActions,
  messageRendered: handleMessageRendered,
});

// -------------------------------------------------------------------------
// MessageList generation view bridge
// -------------------------------------------------------------------------
const chatQuestionAnswerView = useChatQuestionAnswerView({
  scrollToBottom,
  scrollToBottomAfterRender,
  scrollToTop,
  scrollToMessage,
  scrollToLatestUserMessage,
  isAtBottom: getIsAtBottom,
  scheduleRenderedFrameUpdate,
});

// -------------------------------------------------------------------------
// Watchers and DOM lifecycle
// -------------------------------------------------------------------------

watch(
  () => [
    props.loading,
    props.messages.length,
    props.historyRendering,
    props.historyMessagesReady,
  ],
  ([loading, , historyRendering]) => {
    resetLatestUserMessageCache();

    if (historyRendering) {
      // history render 중에는 content-rendered 이벤트/부모 타이머를 만들지 않고,
      // MessageList 내부 직렬 루프에서 overlay/scroll 상태만 갱신합니다.
      updateOverlayScrollbarFrame();
      return;
    }

    updateOverlayScrollbarFrame();

    // 답변 생성 중에는 질문 직후 scrollToLatestUserMessage()가 계산한 spacer를 유지합니다.
    // watch에서 비동기로 다시 계산하면 답변 높이 변화와 맞물려 질문 박스가 흔들릴 수 있습니다.
    if (loading) return;

    refreshFocusSpacerAfterRender();
  }
);

watch(
  () => props.historyRenderKey,
  (nextKey, previousKey) => {
    if (nextKey === previousKey) return;
    clearHistoryRenderState();
  },
  {flush: "sync"}
);

watch(
  () => props.messages,
  async (nextMessages, previousMessages) => {
    if (!props.historyRendering || nextMessages === previousMessages) return;

    // 대화방 이동 중 이전 방 Mermaid/후처리 루프가 아직 진행 중이면
    // 새 메시지 배열이 들어와도 historyRenderCompleting 때문에 새 방 렌더가
    // 시작되지 않을 수 있습니다. 메시지 소스가 바뀌는 즉시 기존 run을
    // 무효화해서 최신 방의 후처리만 진행되도록 합니다.
    clearHistoryRenderState();

    // 메시지 개수가 같은 방으로 이동하는 경우 length watcher가 다시 실행되지
    // 않을 수 있으므로, DOM 교체 tick 이후 최신 메시지 기준 후처리를 직접 시작합니다.
    if (props.historyMessagesReady) {
      await nextTick();
      startHistoryRoomRender();
    }
  },
  {flush: "sync"}
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
  window.visualViewport?.addEventListener("resize", scheduleResizeRecalculate, {
    passive: true,
  });
  addUserScrollIntentListeners(window);
});

onBeforeUnmount(() => {
  clearHistoryRenderState();
  clearResizeRecalculateScheduler();
  chatQuestionAnswerView.cleanup();
  cleanupOverlayScrollbar();

  if (typeof window === "undefined") return;
  window.removeEventListener("resize", scheduleResizeRecalculate);
  window.visualViewport?.removeEventListener(
    "resize",
    scheduleResizeRecalculate
  );
  removeUserScrollIntentListeners(window);
});

defineExpose({
  scrollToBottom,
  scrollToBottomAfterRender,
  scrollToTop,
  scrollToMessage,
  scrollToLatestUserMessage,
  isAtBottom: getIsAtBottom,
  getScrollElement,
});
</script>

<style scoped lang="scss">
.message-list {
  min-width: 0;
  min-height: 0;
  overflow-anchor: none;
}


.message-list--history-rendering {
  /*
   * Android 최초 진입 시 Mermaid는 실제 DOM 레이아웃을 참조해 SVG를 계산합니다.
   * visibility:hidden / overflow:hidden / contain:paint 조합은 Android Chrome/WebView에서
   * 최초 1회 Mermaid 크기 계산이 실패하는 원인이 될 수 있어 사용하지 않습니다.
   * 화면 노출은 opacity로만 막고, DOM은 정상 레이아웃 상태로 유지합니다.
   */
  opacity: 0 !important;
  pointer-events: none !important;
  scroll-behavior: auto !important;
  overscroll-behavior: none !important;
  scrollbar-width: none !important;
  overflow-anchor: none;
}

:global(body.android-webview) .message-list,
:global(body.android-chrome) .message-list {
  /*
   * Lazy prepend 위치는 MessageList의 DOM anchor 보정으로만 처리합니다.
   * Android 브라우저 scroll anchoring과 수동 scrollTop 보정이 동시에 동작하면
   * lazy load 직후 viewport가 중간 위치로 튈 수 있습니다.
   */
  overflow-anchor: none;
}

.message-list--manual-stream {
  scroll-behavior: auto !important;
  overflow-anchor: none;
}

.message-list--manual-stream .typing-row,
.message-list--manual-stream .stream-focus-spacer,
.message-list--manual-stream .message-list-anchor {
  overflow-anchor: none;
}

.typing-row {
  flex: 0 0 auto;
}
.stream-focus-spacer {
  flex: 0 0 auto;
  width: 100%;
  pointer-events: none;
}
</style>
