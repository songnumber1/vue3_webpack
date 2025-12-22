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
export default {
  name: "AppHeader",
  computed: {
    theme() {
      return this.$store.state.ui.theme;
    },
    isMobile() {
      return this.$store.state.ui.isMobile;
    },
  },
  methods: {
    openSidebar() {
      this.$store.dispatch("ui/openSidebar");
    },
    setTheme(t) {
      this.$store.dispatch("ui/setTheme", t);
      this.$theme.setTheme(t);
    },
  },
};
</script>

<style scoped>
.header {
  width: 100%;
  height: 56px;
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
  color: #fff;
  border-color: transparent;
}
</style>
