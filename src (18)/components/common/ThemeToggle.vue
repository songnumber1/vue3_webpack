<template>
  <div class="theme-toggle">
    <button
      v-for="t in themes"
      :key="t.id"
      class="icon-btn"
      :aria-pressed="theme === t.id"
      :title="t.label"
      @click="setTheme(t.id)"
      style="padding: 8px 10px;"
    >
      <span aria-hidden="true">{{ t.icon }}</span>
    </button>
  </div>
</template>

<script>
export default {
  name: "ThemeToggle",
  computed: {
    theme() {
      return this.$theme.theme;
    },
    themes() {
      return this.$theme.themes;
    },
  },
  methods: {
    setTheme(id) {
      this.$theme.setTheme(id);
    },
  },
};
</script>

<style scoped>
.theme-toggle{
  display:flex;
  gap: var(--space-2);
}
button[aria-pressed="true"]{
  outline: 2px solid color-mix(in srgb, var(--primary) 55%, transparent);
}
</style>
