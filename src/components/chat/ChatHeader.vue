<template>
  <header class="chat-header">
    <div>
      <h1>Chat Assistant</h1>
      <p>Vue 3 · Composition API · Webpack · Responsive UX</p>
    </div>
    <div class="header-actions">
      <button class="pill-button" type="button">UI Demo</button>
      <IconButton :icon="themeIcon" title="테마 전환" @click="$emit('toggle-theme')" />
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import IconButton from '@/components/common/IconButton.vue'

const props = defineProps({ themeName: { type: String, default: 'light' } })
defineEmits(['toggle-theme'])
const themeIcon = computed(() => props.themeName === 'dark' ? '☀️' : '🌙')
</script>
