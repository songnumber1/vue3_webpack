<template>
  <footer class="prompt-wrap">
    <div class="prompt-box">
      <button class="attach-button" type="button" title="첨부">＋</button>
      <textarea
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        placeholder="메시지를 입력하세요. Shift+Enter는 줄바꿈"
        rows="1"
        @input="resize"
        @keydown.enter.exact.prevent="submit"
      />
      <button class="send-button" type="button" :disabled="disabled || !text.trim()" @click="submit">➤</button>
    </div>
    <p class="prompt-help">API 없이 동작하는 UI 데모입니다. 실제 연동은 resolver/api.js에서 확장하세요.</p>
  </footer>
</template>

<script setup>
import { nextTick, ref } from 'vue'

defineProps({ disabled: { type: Boolean, default: false } })
const emit = defineEmits(['submit'])
const text = ref('')
const textareaRef = ref(null)

function resize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 160)}px`
}

function submit() {
  const value = text.value.trim()
  if (!value) return
  emit('submit', value)
  text.value = ''
  nextTick(resize)
}
</script>
