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
      <label class="app-header__theme-picker">
        <span class="app-header__theme-label">Theme</span>
        <select
          class="app-header__theme-select"
          v-model="selectedTheme"
          aria-label="Select theme"
        >
          <option
            v-for="option in availableThemes"
            :key="option"
            :value="option"
          >
            {{ formatThemeLabel(option) }}
          </option>
        </select>
      </label>

      <button
        class="app-header__icon-button"
        @click="toggleTheme"
        :aria-label="`Cycle theme (current: ${theme})`"
      >
        <span v-if="isDark">🌙</span>
        <span v-else-if="theme === 'dim'">🌓</span>
        <span v-else>☀️</span>
      </button>
    </div>
  </header>
</template>

<script>
import { useTheme } from "@/composables/useTheme";
import { computed } from "vue";

export default {
  name: "AppHeader",
  emits: ["toggle-sidebar"],
  setup() {
    const { theme, isDark, availableThemes, setTheme, toggleTheme } =
      useTheme();

    const selectedTheme = computed({
      get: () => theme.value,
      set: (value) => setTheme(value),
    });

    const formatThemeLabel = (name) =>
      name.charAt(0).toUpperCase() + name.slice(1);

    return {
      theme,
      isDark,
      availableThemes,
      selectedTheme,
      toggleTheme,
      formatThemeLabel,
    };
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/layout/appheader.scss";
</style>
