<template>
  <article class="message message--assistant">
    <div class="avatar">AI</div>
    <div class="bubble bubble--assistant">
      <div class="bubble-meta">Assistant</div>
      <div v-if="message.content" ref="contentRef" class="bubble-content markdown-body" v-html="html"></div>
      <MessageActions role="assistant" :content="message.content" />
    </div>
  </article>
</template>

<script setup>
import { nextTick, onMounted, ref, watch } from 'vue'
import { renderMarkdown } from '@/utils/markdown'
import { renderMermaidInElement } from '@/utils/mermaidRenderer'
import MessageActions from './MessageActions.vue'

const props = defineProps({ message: { type: Object, required: true } })
const emit = defineEmits(['rendered'])
const html = ref('<p></p>')
const contentRef = ref(null)
let renderVersion = 0
async function renderContent() {
  const currentVersion = ++renderVersion
  const rendered = props.message.content ? await renderMarkdown(props.message.content) : ''
  if (currentVersion !== renderVersion) return
  html.value = rendered
  await nextTick()
  await renderMermaidInElement(contentRef.value)
  emit('rendered')
}
watch(() => props.message.content, renderContent, { immediate: true })
onMounted(renderContent)
</script>
