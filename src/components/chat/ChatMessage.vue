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
import { copyText } from '@/utils/clipboard'

const props = defineProps({ message: { type: Object, required: true } })
const avatar = computed(() => props.message.role === 'user' ? '나' : 'AI')
const label = computed(() => props.message.role === 'user' ? 'You' : 'Assistant')
const html = computed(() => renderMarkdown(props.message.content))
async function copy() {
  try {
    await copyText(props.message.content)
  } catch (error) {
    console.warn('Failed to copy message.', error)
  }
}
</script>
