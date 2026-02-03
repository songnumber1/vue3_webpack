<template>
  <header class="header">
    <!-- ✅ SM일 때만 Header 좌측에 햄버거 -->
    <button
      v-if="isMobile"
      type="button"
      class="hamburger"
      aria-label="Open sidebar"
      @click="openSidebar"
    >
      ☰
    </button>

    <strong class="title">DS Assistant</strong>

    <div class="themes">
      <button type="button" class="gear" aria-label="Layout settings" @click="openLayoutSettings">⚙</button>
      <button
        v-for="t in $theme.THEMES"
        :key="t"
        class="theme-btn"
        :class="{ active: theme === t }"
        @click="setTheme(t)"
      >
        {{ t }}
      </button>
    </div>
  </header>
</template>

<script>
import { useUiStore } from "@/stores/uiStore";

export default {
  name: "AppHeader",

  computed: {
    store() {
      return useUiStore();
    },

    theme() {
      return this.store.theme;
    },

    isMobile() {
      return this.store.isMobile;
    },
  },

  methods: {
    openLayoutSettings() {
      openModal(LayoutSettings, {}, { title: 'Layout & Theme Settings', size: 'md' });
    },
    openSidebar() {
      this.store.openSidebar();
    },

    setTheme(t) {
      this.store.setTheme(t);
      this.$theme.setTheme(t);
    },
  },
};
</script>

<style scoped>
.header {
  width: 100%;
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
}

.hamburger {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  cursor: pointer;
}

.hamburger:hover {
  background: var(--bg-soft);
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
  color: var(--accent-contrast);
  border-color: transparent;
}

.gear {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
}

.gear:hover {
  background: var(--bg-soft);
}
</style>
