<template>
  <header class="header">
    <button type="button" class="hamburger" @click="$emit('toggle-sidebar')">☰</button>
    <strong>DS Assistant</strong>

    <div class="themes">
      <button
        v-for="t in ['light', 'dim', 'dark']"
        :key="t"
        class="theme-btn"
        :class="{ active: theme === t }"
        @click="$emit('theme-change', t)"
      >
        {{ t }}
      </button>
    </div>
  </header>
</template>

<script>
export default {
  props: {
    theme: String,
    isMobile: Boolean,
  },
};
</script>
