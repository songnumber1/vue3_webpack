<template>
  <header class="header">
    <button @click="$emit('toggle-sidebar')">☰</button>
    <strong>DS Assistant</strong>
    <div>
      <button
        v-for="t in ['light', 'dim', 'dark']"
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
  props: { isMobile: Boolean },
  data() {
    return { theme: "light" };
  },
  mounted() {
    const t = localStorage.getItem("theme") || "light";
    this.setTheme(t);
  },
  methods: {
    setTheme(t) {
      this.theme = t;
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("theme", t);
    },
  },
};
</script>
