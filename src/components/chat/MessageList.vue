<template>
  <section
    ref="scrollRef"
    class="message-list min-w-0 min-h-0"
    :class="{'invisible pointer-events-none opacity-0 [scroll-behavior:auto!important]': initialHydrating}"
    :inert="initialHydrating ? '' : null"
    aria-live="polite"
    :aria-busy="initialHydrating ? 'true' : 'false'"
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
      @rendered="handleMessageRendered(message.id, $event)"
      @regenerate="$emit('regenerate', $event)"
    />
    <div v-if="loading" class="typing-row flex-none">
      <span></span><span></span><span></span>
    </div>
    <div
      v-if="streamFocusSpacerHeight > 0"
      class="stream-focus-spacer w-full flex-none pointer-events-none"
      :style="{height: `${streamFocusSpacerHeight}px`}"
      aria-hidden="true"
    ></div>
    <div ref="bottomRef" class="message-list-anchor h-px w-full pointer-events-none" aria-hidden="true"></div>
  </section>
</template>

<script setup>
import ChatMessage from "./ChatMessage.vue";
import {useMessageListScroll} from "@/composables/chat/message-list/useMessageListScroll";

const props = defineProps({
  messages: {type: Array, required: true},
  loading: {type: Boolean, default: false},
  autoScrollOnAnswer: {type: Boolean, default: false},
  initialHydrating: {type: Boolean, default: false},
});

const emit = defineEmits([
  "content-rendered",
  "history-hydrated",
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
