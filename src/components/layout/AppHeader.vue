<template>
  <header class="header">
    <!-- ✅ SM일 때만 Header 좌측에 햄버거 -->
    <button
      v-if="isMobile"
      type="button"
      class="icon-btn"
      aria-label="Open sidebar"
      @click="openSidebar"
    >
      <AppIcon name="menu" />
    </button>

    <div class="brand">
      <div class="logo" aria-hidden="true">DS</div>
      <strong class="title">DS Assistant</strong>
    </div>

    <div class="themes">
      <button
        v-for="t in $theme.THEMES"
        :key="t"
        class="theme-btn"
        :class="{ active: theme === t }"
        @click="setTheme(t)"
      >
        <span class="theme-dot" aria-hidden="true" />
        {{ t }}
      </button>
    </div>
  </header>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";
import { useUiStore } from "@/stores/uiStore";

export default {
  name: "AppHeader",

  components: { AppIcon },

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
  border-bottom: 1px solid var(--header-border, var(--border));
  background: var(--header-bg, var(--bg-surface));
  position: sticky;
  top: 0;
  z-index: 90;
  backdrop-filter: saturate(140%) blur(10px);
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
}

.icon-btn:hover {
  transform: translateY(-1px);
}

.icon-btn:active {
  transform: translateY(0);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  color: var(--accent-contrast);
  background: linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)));
  box-shadow: var(--shadow-sm);
}

.title {
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-xs, none);
  transition: transform 0.15s ease, background 0.15s ease;
}

.theme-btn:hover {
  transform: translateY(-1px);
}

.theme-btn.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)));
  color: #fff;
  border-color: transparent;
}

.theme-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.6;
}

@media (max-width: 520px) {
  .themes {
    gap: 4px;
  }
  .theme-btn {
    padding: 6px 8px;
  }
}
</style>
