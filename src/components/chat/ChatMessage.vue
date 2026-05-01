<template>
  <article :class="['message', `message--${message.role}`]">
    <div class="avatar">{{ avatar }}</div>
    <div class="bubble">
      <div class="bubble-meta">{{ label }}</div>
      <div ref="contentRef" class="bubble-content markdown-body" v-html="html"></div>
      <div v-if="message.role === 'assistant'" class="bubble-tools">
        <button type="button" @click="copy">복사</button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { renderMermaidInElement } from '@/utils/mermaidRenderer'
import { copyText } from '@/utils/clipboard'

const props = defineProps({ message: { type: Object, required: true } })
const avatar = computed(() => props.message.role === 'user' ? '나' : 'AI')
const label = computed(() => props.message.role === 'user' ? 'You' : 'Assistant')
const html = ref('<p></p>')
const contentRef = ref(null)
let renderVersion = 0

async function renderContent() {
  const currentVersion = ++renderVersion
  const rendered = await renderMarkdown(props.message.content)
  if (currentVersion !== renderVersion) return

  html.value = rendered
  await nextTick()
  await renderMermaidInElement(contentRef.value)
}

async function copy() {
  try {
    await copyText(props.message.content)
  } catch (error) {
    console.warn('Failed to copy message.', error)
  }
}

watch(() => props.message.content, renderContent, { immediate: true })
onMounted(renderContent)
</script>
