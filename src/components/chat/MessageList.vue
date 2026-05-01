<template>
  <section ref="scrollRef" class="message-list">
    <ChatMessage v-for="message in messages" :key="message.id" :message="message" />
    <div v-if="loading" class="typing-row">
      <span></span><span></span><span></span>
    </div>
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
function scrollToBottom() {
  if (!scrollRef.value) return
  scrollRef.value.scrollTop = scrollRef.value.scrollHeight
}

defineExpose({ scrollToBottom })
</script>
