<template>
  <header class="mobile-topbar">
    <button class="round-icon" type="button" aria-label="메뉴 열기" @click="$emit('open-drawer')">☰</button>

    <div class="model-selector" ref="selectorRef">
      <button class="model-trigger" type="button" @click="open = !open">
        <span>{{ currentModel.label }}</span>
        <span class="chevron">⌄</span>
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

    <div class="mobile-actions">
      <button class="round-icon" type="button" aria-label="공유">⌯</button>
      <button class="round-icon" type="button" aria-label="테마 전환" @click="$emit('toggle-theme')">{{ themeIcon }}</button>
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
const emit = defineEmits(['update:modelValue', 'toggle-theme', 'open-drawer'])

const open = ref(false)
const selectorRef = ref(null)
const currentModel = computed(() => props.models.find((model) => model.id === props.modelValue) || props.models[0])
const themeIcon = computed(() => props.themeName === 'dark' ? '☀' : '◐')

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
