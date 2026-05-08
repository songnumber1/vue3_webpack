<template>
  <article :class="['message', `message--${message.role}`]">
    <div class="avatar">{{ avatar }}</div>
    <div class="bubble">
      <div class="bubble-meta">{{ label }}</div>

      <div v-if="hasAttachments" class="message-attachments" :class="`message-attachments--${message.role}`">
        <template v-for="file in message.attachments" :key="file.id">
          <button
            v-if="file.kind === 'image'"
            type="button"
            class="message-image-card"
            :aria-label="`${file.name} 크게 보기`"
            @click.stop="openImage(file)"
          >
            <img :src="getPreviewUrl(file)" :alt="file.name" @load="emitRendered" @error="emitRendered" />
          </button>

          <a
            v-else
            class="message-file-card"
            :href="file.url"
            :download="file.name"
          >
            <span class="message-file-icon" aria-hidden="true">📄</span>
            <span>
              <strong>{{ file.name }}</strong>
              <small>{{ formatFileSize(file.size) }}</small>
            </span>
          </a>
        </template>
      </div>

      <div v-if="message.content" ref="contentRef" class="bubble-content markdown-body" v-html="html"></div>
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
const emit = defineEmits(['rendered'])
const avatar = computed(() => props.message.role === 'user' ? '나' : 'AI')
const label = computed(() => props.message.role === 'user' ? 'You' : 'Assistant')
const hasAttachments = computed(() => Array.isArray(props.message.attachments) && props.message.attachments.length > 0)
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
  emitRendered()
}

function emitRendered() {
  emit('rendered')
}

function getPreviewUrl(file) {
  return file?.previewUrl || file?.url || ''
}

function openImage(file) {
  window.dispatchEvent(new CustomEvent('chat:image-preview', { detail: { ...file, url: getPreviewUrl(file) } }))
}

function formatFileSize(size) {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

async function copy() {
  try {
    await copyText(props.message.content || '')
  } catch (error) {
    console.warn('Failed to copy message.', error)
  }
}

watch(() => props.message.content, renderContent, { immediate: true })
onMounted(renderContent)
</script>
