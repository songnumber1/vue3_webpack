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
import {useMessageListScroll} from "@/composables/chat/useChatScroll";

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

const {
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
} = useMessageListScroll({props, emit});

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
.message-list-shell {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.message-list-shell > .message-list {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

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
   * Lazy prepend 위치는 useMessageListScroll의 DOM anchor 보정으로만 처리합니다.
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

.message-list-anchor {
  width: 100%;
  height: 1px;
  pointer-events: none;
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
