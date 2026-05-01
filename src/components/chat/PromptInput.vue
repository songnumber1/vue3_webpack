<template>
  <footer class="prompt-wrap" :class="{ 'prompt-wrap--floating': floating }">
    <form class="prompt-box" @submit.prevent="submit">
      <button class="attach-button" type="button" title="첨부">＋</button>
      <textarea
        ref="textareaRef"
        v-model="text"
        :disabled="disabled"
        :placeholder="placeholder"
        rows="1"
        @input="resize"
        @keydown.enter.exact.prevent="submit"
      />
      <button class="send-button" type="submit" :disabled="disabled || !text.trim()" title="전송">↗</button>
    </form>
    <p v-if="showHelp" class="prompt-help">API 없이 동작하는 UI 데모입니다. 실제 연동은 resolver/api.js에서 확장하세요.</p>
  </footer>
</template>

<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  disabled: { type: Boolean, default: false },
  floating: { type: Boolean, default: false },
  showHelp: { type: Boolean, default: true },
  placeholder: { type: String, default: '무엇이든 물어보세요' }
})
const emit = defineEmits(['submit'])
const text = ref('')
const textareaRef = ref(null)

function resize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 180)}px`
}

function submit() {
  const value = text.value.trim()
  if (!value || props.disabled) return
  emit('submit', value)
  text.value = ''
  nextTick(resize)
}
</script>
