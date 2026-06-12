<template>
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
    <ChatMessageRouter
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :show-regenerate="!readonly && isLastAssistantMessage(message)"
      :message-dom-id="String(message.id || '')"
      :message-dom-role="message.role"
      :defer-mermaid-enhancement="historyRendering"
      @rendered="handleMessageRendered(message.id, $event)"
      @regenerate="$emit('regenerate', $event)"
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
</template>

<script setup>
import {computed} from "vue";
import ChatMessageRouter from "./ChatMessageRouter.vue";
import {useMessageListScroll} from "@/composables/chat/message-list/useMessageListScroll";

const props = defineProps({
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
