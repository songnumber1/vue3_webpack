<template>
  <footer class="prompt-wrap" :class="{ 'prompt-wrap--floating': floating }">
    <form class="prompt-box" @submit.prevent="submit">
      <div v-if="attachments.length" class="attachment-preview-row" aria-label="첨부 파일 목록">
        <div
          v-for="file in attachments"
          :key="file.id"
          class="attachment-preview-card"
          :class="{ 'attachment-preview-card--image': file.kind === 'image' }"
        >
          <button
            v-if="file.kind === 'image'"
            type="button"
            class="attachment-preview-thumb"
            :aria-label="`${file.name} 미리보기`"
            @click="previewImage(file)"
          >
            <img :src="file.url" :alt="file.name" />
          </button>
          <div v-else class="attachment-preview-file" aria-hidden="true">📄</div>

          <div class="attachment-preview-info">
            <strong>{{ file.name }}</strong>
            <span>{{ formatFileSize(file.size) }}</span>
          </div>

          <button
            type="button"
            class="attachment-preview-remove"
            :aria-label="`${file.name} 제거`"
            @click="removeAttachment(file.id)"
          >
            ×
          </button>
        </div>
      </div>

      <div class="prompt-input-row">
        <div class="attach-menu-wrap">
          <button
            ref="attachButtonRef"
            class="attach-button"
            :class="{ 'attach-button--active': attachMenuOpen }"
            type="button"
            title="첨부"
            aria-label="첨부"
            :aria-expanded="attachMenuOpen"
            :disabled="disabled"
            @click="toggleAttachMenu"
          >
            ＋
          </button>

          <div v-if="attachMenuOpen" class="attach-menu" role="menu">
            <button type="button" role="menuitem" @click="openFilePicker('all')">
              <span aria-hidden="true">📎</span>
              <strong>사진 및 파일 추가</strong>
            </button>
            <button type="button" role="menuitem" @click="openFilePicker('image')">
              <span aria-hidden="true">🖼️</span>
              <strong>이미지 추가</strong>
            </button>
          </div>
        </div>

        <textarea
          ref="textareaRef"
          v-model="text"
          :disabled="disabled"
          :placeholder="placeholder"
          rows="1"
          @focus="handleFocus"
          @blur="emit('blur')"
          @input="resize"
          @keydown.enter.exact.prevent="submit"
          @paste="handlePaste"
        />

        <button
          class="send-button"
          type="submit"
          :disabled="disabled || !canSubmit"
          title="전송"
          aria-label="전송"
        >
          ↗
        </button>
      </div>

      <input
        ref="fileInputRef"
        class="visually-hidden-file-input"
        type="file"
        multiple
        :accept="fileAccept"
        @change="handleFileChange"
      />
    </form>
    <p v-if="showHelp" class="prompt-help">API 없이 동작하는 UI 데모입니다. 실제 연동은 resolver/api.js에서 확장하세요.</p>
  </footer>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { createId } from '@/utils/id'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  floating: { type: Boolean, default: false },
  showHelp: { type: Boolean, default: true },
  placeholder: { type: String, default: '무엇이든 물어보세요' }
})

const emit = defineEmits(['submit', 'focus', 'blur', 'height-change'])
const text = ref('')
const textareaRef = ref(null)
const fileInputRef = ref(null)
const attachButtonRef = ref(null)
const attachments = ref([])
const attachMenuOpen = ref(false)
const fileAccept = ref('')
let lastHeight = 0

const canSubmit = computed(() => text.value.trim().length > 0 || attachments.value.length > 0)

function resize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  const nextHeight = Math.min(el.scrollHeight, 180)
  el.style.height = `${nextHeight}px`
  if (nextHeight !== lastHeight) {
    lastHeight = nextHeight
    emit('height-change', nextHeight)
  }
}

function handleFocus() {
  emit('focus')
  nextTick(resize)
}

function submit() {
  const value = text.value.trim()
  if ((!value && attachments.value.length === 0) || props.disabled) return

  emit('submit', {
    text: value,
    attachments: attachments.value.map((file) => ({ ...file }))
  })

  text.value = ''
  attachments.value = []
  attachMenuOpen.value = false
  nextTick(resize)
}

function toggleAttachMenu() {
  if (props.disabled) return
  attachMenuOpen.value = !attachMenuOpen.value
}

function openFilePicker(type) {
  attachMenuOpen.value = false
  fileAccept.value = type === 'image' ? 'image/*' : ''
  nextTick(() => fileInputRef.value?.click())
}

function handleFileChange(event) {
  addFiles(event.target.files)
  event.target.value = ''
}

function handlePaste(event) {
  const files = Array.from(event.clipboardData?.files || [])
  if (!files.length) return
  addFiles(files)
}

function addFiles(fileList) {
  const nextFiles = Array.from(fileList || [])
  if (!nextFiles.length) return

  const mapped = nextFiles.map((file) => {
    const isImage = file.type?.startsWith('image/')
    return {
      id: createId('attachment'),
      name: file.name || '첨부 파일',
      size: file.size || 0,
      type: file.type || 'application/octet-stream',
      kind: isImage ? 'image' : 'file',
      url: URL.createObjectURL(file),
      file
    }
  })

  attachments.value = [...attachments.value, ...mapped]
  nextTick(() => {
    resize()
    emit('height-change', lastHeight)
  })
}

function removeAttachment(id) {
  const target = attachments.value.find((file) => file.id === id)
  if (target?.url) URL.revokeObjectURL(target.url)
  attachments.value = attachments.value.filter((file) => file.id !== id)
  nextTick(resize)
}

function previewImage(file) {
  window.dispatchEvent(new CustomEvent('chat:image-preview', { detail: file }))
}

function formatFileSize(size) {
  if (!size) return '0 B'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function handleDocumentClick(event) {
  if (!attachMenuOpen.value) return
  const root = attachButtonRef.value?.closest('.attach-menu-wrap')
  if (root?.contains(event.target)) return
  attachMenuOpen.value = false
}

onMounted(() => {
  resize()
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  attachments.value.forEach((file) => {
    if (file.url) URL.revokeObjectURL(file.url)
  })
})
</script>
