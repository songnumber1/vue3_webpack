<template>
  <header class="mobile-topbar">
    <button class="round-icon menu-toggle" type="button" aria-label="메뉴 열기" @click="$emit('open-drawer')">
      <span class="icon-lines"></span>
    </button>

    <div class="model-selector" ref="selectorRef">
      <button class="model-trigger" type="button" aria-label="모델 선택" @click="open = !open">
        <span>{{ currentModel.label }}</span>
        <svg class="chevron" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5.5 7.5 10 12l4.5-4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="open" class="model-menu">
        <button
          v-for="model in models"
          :key="model.id"
          class="model-option"
          :class="{ active: model.id === modelValue }"
          type="button"
          @click="select(model.id)"
        >
          <strong>{{ model.label }}</strong>
          <small>{{ model.description }}</small>
        </button>
      </div>
    </div>

    <div class="topbar-actions">
      <button class="round-icon theme-toggle" type="button" aria-label="테마 전환" @click="$emit('toggle-theme')">
        <span class="theme-glyph" :class="{ 'theme-glyph--dark': themeName === 'dark' }"></span>
      </button>
      <button class="round-icon document-toggle" type="button" aria-label="Swagger 문서" title="Swagger 문서" @click="$emit('open-swagger')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7 3.5h7.2L19 8.3V20a.5.5 0 0 1-.5.5h-11A2.5 2.5 0 0 1 5 18V5.5A2 2 0 0 1 7 3.5Z"/>
          <path d="M14 3.5V8h4.5"/>
          <path d="M8.5 12h7"/>
          <path d="M8.5 15.5h7"/>
        </svg>
      </button>
      <button class="round-icon test-toggle" type="button" aria-label="실제 호출 테스트" title="실제 호출 테스트" @click="$emit('open-bridge')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 3.5v5.2L4.6 17a2.5 2.5 0 0 0 2.2 3.7h10.4a2.5 2.5 0 0 0 2.2-3.7L15 8.7V3.5"/>
          <path d="M8 3.5h8"/>
          <path d="M7.2 15.5h9.6"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  models: { type: Array, required: true },
  themeName: { type: String, default: 'dark' }
})
const emit = defineEmits(['update:modelValue', 'toggle-theme', 'open-drawer', 'open-swagger', 'open-bridge'])

const open = ref(false)
const selectorRef = ref(null)
const currentModel = computed(() => props.models.find((model) => model.id === props.modelValue) || props.models[0])

function select(id) {
  emit('update:modelValue', id)
  open.value = false
}

function onClickOutside(event) {
  if (!selectorRef.value || selectorRef.value.contains(event.target)) return
  open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>
