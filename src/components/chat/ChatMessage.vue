<template>
  <article :class="['message', `message--${message.role}`]">
    <div class="avatar">{{ avatar }}</div>
    <div class="bubble">
      <div class="bubble-meta">{{ label }}</div>
      <div class="bubble-content" v-html="html"></div>
      <div v-if="message.role === 'assistant'" class="bubble-tools">
        <button type="button" @click="copy">복사</button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps({ message: { type: Object, required: true } })
const avatar = computed(() => props.message.role === 'user' ? '나' : 'AI')
const label = computed(() => props.message.role === 'user' ? 'You' : 'Assistant')
const html = computed(() => renderMarkdown(props.message.content))
function copy() {
  navigator.clipboard?.writeText(props.message.content)
}
</script>
