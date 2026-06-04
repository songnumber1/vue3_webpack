<template>
  <section
    ref="scrollRef"
    class="message-list"
    :class="{
      'message-list--history-rendering': historyRendering,
      'message-list--manual-stream': loading && !autoScrollOnAnswer,
    }"
    :inert="historyRendering ? '' : null"
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
      :show-regenerate="isLastAssistantMessage(message)"
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
import ChatMessageRouter from "./ChatMessageRouter.vue";
import {useMessageListScroll} from "@/composables/chat/message-list/useMessageListScroll";

const props = defineProps({
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
  historyRendering: {type: Boolean, default: false},
  historyMessagesReady: {type: Boolean, default: false},
  hasPreviousHistoryMessages: {type: Boolean, default: false},
  historyLazyTopThreshold: {type: Number, default: 96},
});

const emit = defineEmits([
  "content-rendered",
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
  handleScroll,
  handleUserScrollIntent,
  handleMessageRendered,
  scrollToBottom,
  scrollToBottomAfterRender,
  scrollToLatestUserMessage,
  getIsAtBottom,
  getScrollElement,
} = useMessageListScroll({props, emit});

defineExpose({
  scrollToBottom,
  scrollToBottomAfterRender,
  scrollToLatestUserMessage,
  isAtBottom: getIsAtBottom,
  getScrollElement,
});
</script>

<style scoped lang="scss">
.message-list {
  min-width: 0;
  min-height: 0;
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
