<template>
  <div v-show="visible" class="message-list-shell">
    <section
      ref="scrollRef"
      class="message-list"
      :class="{
        'message-list--history-rendering':
          historyRendering && !historyMarkdownVisible,
        'message-list--manual-stream': loading && !autoScrollOnAnswer,
      }"
      :inert="historyRendering && !historyMarkdownVisible ? '' : null"
      aria-live="polite"
      :aria-busy="historyRendering ? 'true' : 'false'"
      @scroll.passive="handleScroll"
      @touchstart.passive="handleUserScrollIntent"
      @wheel.passive="handleUserScrollIntent"
      @pointerdown.passive="handleUserScrollIntent"
    >
      <div v-if="showAndroidHistoryLoadMore" class="history-load-more-row">
        <button
          class="history-load-more-button"
          type="button"
          :disabled="previousHistoryLoadInProgress"
          @click="handleManualPreviousHistoryLoad($event)"
        >
          <span v-if="previousHistoryLoadInProgress"
            >이전 대화 불러오는 중...</span
          >
          <span v-else>이전 대화 {{ historyLazyChunkSize }}개 더 보기</span>
        </button>
      </div>
      <div
        v-for="(sector, sectorIndex) in messageTurnSectors"
        :key="sector.id"
        class="message-turn-sector"
        :class="{
          'message-turn-sector--last':
            shouldApplyLastTurnSectorMinHeight(sectorIndex),
        }"
        :style="getTurnSectorStyle(sectorIndex)"
      >
        <ChatMessageRouter
          v-for="message in sector.messages"
          :key="message.id"
          :message="message"
          :show-regenerate="!readonly && isLastAssistantMessage(message)"
          :message-dom-id="String(message.id || '')"
          :message-dom-role="message.role"
          :defer-mermaid-enhancement="historyRendering"
          @rendered="handleMessageRendered(message.id, $event)"
          @regenerate="$emit('regenerate', $event)"
        />
      </div>
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
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import ChatMessageRouter from "./ChatMessageRouter.vue";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {useMessageFocusSpacer} from "@/composables/chat/internal/message-list/useMessageFocusSpacer";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {createMessageScrollTargetController} from "@/composables/chat/internal/message-list/useMessageScrollTarget";
import {
  isAndroidHistoryRenderRuntime,
  shouldUseManualHistoryLoadMode,
} from "@/composables/chat/internal/message-list/messageListScrollUtils";
import {createMessageLazyPrependScrollController} from "@/composables/chat/internal/message-list/useMessageLazyPrependScroll";
import {createMessageOverlayScrollSyncController} from "@/composables/chat/internal/message-list/useMessageOverlayScrollSync";
import {
  createLatestUserMessageElementFinder,
  createMessageTargetScrollController,
} from "@/composables/chat/internal/message-list/useMessageTargetScroll";
import {createMessageBottomScrollController} from "@/composables/chat/internal/message-list/useMessageBottomScroll";
import {createMessageUserScrollIntentController} from "@/composables/chat/internal/message-list/useMessageUserScrollIntent";
import {createMessageResizeRecalculateController} from "@/composables/chat/internal/message-list/useMessageResizeRecalculate";
import {createMessageHistoryRenderReadinessController} from "@/composables/chat/internal/message-list/useMessageHistoryRenderReadiness";
import {createMessageHistoryPostProcessController} from "@/composables/chat/internal/message-list/useMessageHistoryPostProcess";
import {createMessageHistoryRenderLifecycleController} from "@/composables/chat/internal/message-list/useMessageHistoryRenderLifecycle";
import {
  BOTTOM_THRESHOLD,
  KEYBOARD_SUBMIT_STABLE_SCROLL_DELAYS,
  RESIZE_RECALCULATE_DEBOUNCE_MS,
  STABLE_SCROLL_DELAYS,
} from "@/composables/chat/internal/message-list/messageListScrollConstants";
import {createPreviousHistoryLazyLoadController} from "@/composables/chat/internal/message-list/usePreviousHistoryLazyLoad";

const props = defineProps({
  visible: {type: Boolean, default: true},
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
  historyRendering: {type: Boolean, default: false},
  historyMarkdownVisible: {type: Boolean, default: false},
  historyMessagesReady: {type: Boolean, default: false},
  hasPreviousHistoryMessages: {type: Boolean, default: false},
  historyLazyTopThreshold: {type: Number, default: 300},
  historyLazyChunkSize: {type: Number, default: 50},
  messageRenderPolicy: {type: Object, default: null},
  pcHistoryLazyInitialCount: {type: Number, default: 100},
  pcHistoryLazyAppendCount: {type: Number, default: 50},
  pcHistoryLazyTopThresholdPx: {type: Number, default: 300},
  mobileHistoryLazyInitialCount: {type: Number, default: 50},
  mobileHistoryLazyAppendCount: {type: Number, default: 25},
  readonly: {type: Boolean, default: false},
  continueProgressiveInitialHistoryRender: {type: Function, default: null},
});

const emit = defineEmits([
  "content-rendered",
  "history-markdown-rendered",
  "history-rendered",
  "load-previous-history",
  "regenerate",
]);

function createMessageTurnSectors(messages = []) {
  const sectors = [];

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const nextMessage = messages[index + 1];
    const sectorMessages = [message];

    if (message?.role === "user" && nextMessage?.role === "assistant") {
      sectorMessages.push(nextMessage);
      index += 1;
    }

    sectors.push({
      id: sectorMessages
        .map((item, itemIndex) => String(item?.id || `${index}-${itemIndex}`))
        .join("__"),
      messages: sectorMessages,
    });
  }

  return sectors;
}

const messageTurnSectors = computed(() =>
  createMessageTurnSectors(props.messages)
);

const lastTurnSectorMinHeight = ref(0);
let lastTurnSectorResizeObserver = null;
let lastTurnSectorResizeFrame = 0;

function isLastTurnSector(sectorIndex) {
  return (
    sectorIndex >= 0 && sectorIndex === messageTurnSectors.value.length - 1
  );
}

function shouldApplyLastTurnSectorMinHeight(sectorIndex) {
  if (props.loading || !isLastTurnSector(sectorIndex)) {
    return false;
  }

  const sector = messageTurnSectors.value[sectorIndex];
  return sector?.messages?.some((message) => message?.role === "assistant");
}

function getTurnSectorStyle(sectorIndex) {
  if (
    !shouldApplyLastTurnSectorMinHeight(sectorIndex) ||
    lastTurnSectorMinHeight.value <= 0
  ) {
    return null;
  }

  return {
    minHeight: `${lastTurnSectorMinHeight.value}px`,
  };
}

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
  return isMermaidRenderingEnabledForPlatform(getRuntimeSystemSettings());
}

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

  const shouldRecalculateSpacer = !(props.loading && !props.autoScrollOnAnswer);
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
  window.visualViewport?.addEventListener("resize", scheduleResizeRecalculate, {
    passive: true,
  });
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

function getMessageListVerticalPadding(element) {
  if (!element || typeof window === "undefined") {
    return 0;
  }

  const style = window.getComputedStyle(element);
  const paddingTop = Number.parseFloat(style.paddingTop || "0") || 0;
  const paddingBottom = Number.parseFloat(style.paddingBottom || "0") || 0;

  return paddingTop + paddingBottom;
}

function updateLastTurnSectorMinHeight() {
  if (lastTurnSectorResizeFrame) {
    cancelAnimationFrame(lastTurnSectorResizeFrame);
  }

  lastTurnSectorResizeFrame = requestAnimationFrame(() => {
    lastTurnSectorResizeFrame = 0;
    const element = scrollRef.value;
    const viewportHeight = Math.floor(element?.clientHeight || 0);
    const verticalPadding = Math.ceil(getMessageListVerticalPadding(element));
    const bottomAnchorHeight = Math.ceil(bottomRef.value?.offsetHeight || 0);

    lastTurnSectorMinHeight.value = Math.max(
      0,
      viewportHeight - verticalPadding - bottomAnchorHeight
    );
  });
}

onMounted(() => {
  nextTick(updateLastTurnSectorMinHeight);

  if (typeof ResizeObserver !== "undefined" && scrollRef.value) {
    lastTurnSectorResizeObserver = new ResizeObserver(() => {
      updateLastTurnSectorMinHeight();
    });
    lastTurnSectorResizeObserver.observe(scrollRef.value);
  }
});

onBeforeUnmount(() => {
  if (lastTurnSectorResizeFrame) {
    cancelAnimationFrame(lastTurnSectorResizeFrame);
    lastTurnSectorResizeFrame = 0;
  }

  if (lastTurnSectorResizeObserver) {
    lastTurnSectorResizeObserver.disconnect();
    lastTurnSectorResizeObserver = null;
  }
});

watch(
  () => [props.messages.length, props.loading],
  () => {
    nextTick(updateLastTurnSectorMinHeight);
  }
);

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(updateLastTurnSectorMinHeight);
    }
  }
);

const showAndroidHistoryLoadMore = computed(
  () =>
    androidManualHistoryLoadMode.value &&
    props.hasPreviousHistoryMessages &&
    !props.historyRendering &&
    !props.loading
);

defineExpose({
  scrollToBottom,
  scrollToBottomAfterRender,
  scrollToInitialTarget,
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

.message-turn-sector {
  display: contents;
}

.message-turn-sector--last {
  display: flow-root;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
}

.message-list--history-prepend-locking {
  overflow-anchor: none !important;
  scroll-behavior: auto !important;
}

.history-load-more-row {
  display: flex;
  justify-content: center;
  flex: 0 0 auto;
  box-sizing: border-box;
  width: 100%;
  padding: 12px 16px 16px;
}

.history-load-more-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  max-width: min(100%, 320px);
  padding: 0 16px;
  border: 1px solid var(--app-control-border, var(--border-color, #d9d9d9));
  border-radius: 999px;
  background: var(--app-control, var(--bg-elevated, #fff));
  color: var(--app-text, var(--text-color, #111827));
  box-shadow: var(--shadow-control, 0 4px 14px rgba(15, 23, 42, 0.08));
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    transform 0.16s ease;
  touch-action: manipulation;
}

.history-load-more-button:active:not(:disabled) {
  transform: translateY(1px);
}

.history-load-more-button:disabled {
  cursor: wait;
  opacity: 0.68;
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
