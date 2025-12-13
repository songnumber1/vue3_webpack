<template>
  <header class="app-header">
    <!-- LEFT -->
    <div class="app-header__left">
      <BaseButton
        class="app-header__icon-button app-header__menu-button"
        variant="ghost"
        aria-label="Toggle sidebar"
        @click="$emit('toggle-sidebar')"
      >
        ☰
      </BaseButton>

      <div class="app-header__title">
        <span class="app-header__logo">⚡</span>
        <span class="app-header__text">DS Assistant UI</span>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="app-header__right">
      <BaseSelect
        class="app-header__theme-select"
        v-model="selectedTheme"
        aria-label="Select theme"
      >
        <option v-for="option in availableThemes" :key="option" :value="option">
          {{ formatThemeLabel(option) }}
        </option>
      </BaseSelect>

      <BaseButton
        class="app-header__icon-button"
        variant="ghost"
        @click="toggleTheme"
        :aria-label="`Cycle theme (current: ${theme})`"
      >
        <span v-if="isDark">🌙</span>
        <span v-else-if="theme === 'dim'">🌓</span>
        <span v-else>☀️</span>
      </BaseButton>
    </div>
  </header>
</template>

<script>
import { computed } from "vue";
import { useTheme } from "@/composables/useTheme";

import BaseButton from "@/components/common/BaseButton.vue";
import BaseSelect from "@/components/common/BaseSelect.vue";
import BaseLabel from "@/components/common/BaseLabel.vue";

export default {
  name: "AppHeader",
  components: {
    BaseButton,
    BaseSelect,
    BaseLabel,
  },
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
