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
  }
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/mixins";

.app-header {
  height: var(--layout-header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background-color: var(--color-surface);
  position: sticky;
  top: 0;
  z-index: 20;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-header__title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 600;
  font-size: var(--font-size-md);
}

.app-header__logo {
  font-size: 1.25rem;
}

.app-header__right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.app-header__icon-button {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-1);
  border-radius: var(--radius-md);
  transition: background-color 0.18s ease, transform 0.05s ease;

  &:hover {
    background-color: var(--color-primary-soft);
  }

  &:active {
    transform: translateY(1px);
  }
}

.app-header__menu-button {
  display: none;
}

@include mobile {
  .app-header__menu-button {
    display: inline-flex;
  }
}

@include tablet {
  .app-header__menu-button {
    display: inline-flex;
  }
}
</style>
