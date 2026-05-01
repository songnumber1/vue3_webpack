<template>
  <section ref="scrollRef" class="message-list" aria-live="polite">
    <ChatMessage v-for="message in messages" :key="message.id" :message="message" />
    <div v-if="loading" class="typing-row">
      <span></span><span></span><span></span>
    </div>
    <div ref="bottomRef" class="message-list-anchor" aria-hidden="true"></div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import ChatMessage from './ChatMessage.vue'

defineProps({
  messages: { type: Array, required: true },
  loading: { type: Boolean, default: false }
})

const scrollRef = ref(null)
const bottomRef = ref(null)

function scrollToBottom(options = {}) {
  const behavior = options.behavior || 'auto'
  if (bottomRef.value?.scrollIntoView) {
    bottomRef.value.scrollIntoView({ block: 'end', behavior })
    return
  }

  if (!scrollRef.value) return
  scrollRef.value.scrollTop = scrollRef.value.scrollHeight
}

defineExpose({ scrollToBottom })
</script>
