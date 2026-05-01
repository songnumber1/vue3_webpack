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

    <button class="round-icon theme-toggle" type="button" aria-label="테마 전환" @click="$emit('toggle-theme')">
      <span class="theme-glyph" :class="{ 'theme-glyph--dark': themeName === 'dark' }"></span>
    </button>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, required: true },
  models: { type: Array, required: true },
  themeName: { type: String, default: 'dark' }
})
const emit = defineEmits(['update:modelValue', 'toggle-theme', 'open-drawer'])

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
