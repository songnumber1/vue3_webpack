<template>
  <header class="header card">
    <div class="left">
      <button
        v-if="isMobile"
        class="btn btn-ghost btn-rsp"
        @click="$emit('toggle-sidebar')"
        aria-label="menu"
      >
        ☰
      </button>

      <div class="title">
        <div class="name">Chat UI</div>
        <div class="sub muted">ChatGPT-style layout · Vue 3 Option API</div>
      </div>
    </div>

    <div class="right">
      <span class="label label-rsp">Theme</span>
      <div class="seg">
        <button
          v-for="t in themes"
          :key="t"
          class="btn btn-sm"
          :class="{ 'btn-primary': t === theme }"
          @click="setTheme(t)"
        >
          {{ t }}
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { useTheme } from "@/composables/useTheme";

export default {
  name: "AppHeader",
  props: {
    isMobile: { type: Boolean, default: false },
  },

  computed: {
    theme() {
      return this.$theme.getState().theme;
    },
    themes() {
      return this.$theme.themes;
    },
  },

  methods: {
    setTheme(t) {
      this.$theme.setTheme(t);
    },
  },
};
</script>

<style scoped lang="scss">
.header {
  margin: var(--gap-2);
  padding: var(--gap-2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--gap-2);
}
.left {
  display: flex;
  align-items: center;
  gap: var(--gap-2);
  min-width: 0;
}
.title {
  min-width: 0;
}
.name {
  font-size: calc(16px * var(--ui-scale));
  font-weight: 700;
}
.sub {
  font-size: var(--font-sm);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 52vw;
}
.right {
  display: flex;
  align-items: center;
  gap: var(--gap-1);
}
.seg {
  display: inline-flex;
  gap: calc(6px * var(--ui-scale));
  padding: calc(4px * var(--ui-scale));
  border-radius: 999px;
  border: 1px solid var(--line);
  background: color-mix(in oklab, var(--panel), var(--panel-2) 30%);
}
</style>
