<template>
  <section
    ref="scrollRef"
    class="message-list"
    aria-live="polite"
    @scroll.passive="handleScroll"
    @touchstart.passive="handleUserScrollIntent"
    @wheel.passive="handleUserScrollIntent"
    @pointerdown.passive="handleUserScrollIntent"
  >
    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :message="message"
      :show-regenerate="isLastAssistantMessage(message)"
      :message-dom-id="String(message.id || '')"
      :message-dom-role="message.role"
      @rendered="handleMessageRendered"
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
import ChatMessage from "./ChatMessage.vue";
import {useMessageListScroll} from "@/composables/chat/message-list/useMessageListScroll";

const props = defineProps({
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
});

const emit = defineEmits(["content-rendered", "regenerate"]);

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
  scrollToLatestUserMessage,
  getIsAtBottom,
  getScrollElement,
} = useMessageListScroll({props, emit});

defineExpose({
  scrollToBottom,
  scrollToLatestUserMessage,
  isAtBottom: getIsAtBottom,
  getScrollElement,
});
</script>

<style scoped>
.message-list {
  min-width: 0;
  min-height: 0;
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
