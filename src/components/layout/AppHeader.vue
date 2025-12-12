<template>
  <header class="app-header">
    <div class="app-header__left">
      <button
        class="app-header__icon-button app-header__menu-button"
        @click="$emit('toggle-sidebar')"
        aria-label="Toggle sidebar"
      >
        ☰
      </button>
      <div class="app-header__title">
        <span class="app-header__logo">⚡</span>
        <span class="app-header__text">DS Assistant UI</span>
      </div>
    </div>

    <div class="app-header__right">
      <button
        class="app-header__icon-button"
        @click="toggleTheme"
        :aria-label="`Toggle theme (current: ${theme})`"
      >
        <span v-if="isDark">🌙</span>
        <span v-else>☀️</span>
      </button>
    </div>
  </header>
</template>

<script>
import { useTheme } from "@/composables/useTheme";

export default {
  name: "AppHeader",
  emits: ["toggle-sidebar"],
  setup() {
    const { theme, isDark, toggleTheme } = useTheme();
    return { theme, isDark, toggleTheme };
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/layout/appheader.scss";
</style>
