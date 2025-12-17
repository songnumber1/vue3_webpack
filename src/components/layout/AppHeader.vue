<template>
  <header class="header">
    <strong class="title">DS Assistant</strong>

    <div class="themes">
      <button
        v-for="t in $theme.THEMES"
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
  name: "AppHeader",
  props: {
    theme: String,
    isMobile: Boolean,
  },
};
</script>

<style scoped>
.header {
  width: 100%;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
}

.title {
  font-size: 14px;
  color: var(--text-primary);
}

.themes {
  margin-left: auto;
  display: inline-flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.theme-btn {
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
}

.theme-btn:hover {
  background: var(--bg-soft);
}

.theme-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}
</style>
